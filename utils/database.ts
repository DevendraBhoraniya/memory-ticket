import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ticket } from '../types';
import { getAllTickets as getLegacyTickets } from './storage';
import { isTemporaryUri, migrateLegacyImage, createThumbnail } from './files';

const TICKETS_KEY = "@memory_tickets";
const ASYNC_STORAGE_MIGRATED_KEY = "@async_storage_migrated_to_sqlite";
const SQLITE_IMAGES_MIGRATED_KEY = "@sqlite_images_migrated_to_permanent";

/**
 * Modern SQLite Database Initialization and Migration
 */
export const initializeDatabase = async (db: SQLite.SQLiteDatabase) => {
  const DATABASE_VERSION = 2;
  
  // 1. Get current version
  let result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    console.log(`[Database] Database version ${currentDbVersion} is up to date.`);
    // Even if up to date, check for image migration if not done before
    await migrateSqliteImages(db);
    return;
  }

  console.log(`[Database] Initializing version ${DATABASE_VERSION}...`);

  // 2. Setup Schema / Migrations
  if (currentDbVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY NOT NULL,
        photoUri TEXT,
        thumbnailUri TEXT,
        title TEXT NOT NULL,
        note TEXT,
        location TEXT,
        date TEXT,
        timestamp INTEGER NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );
    `);
  }

  if (currentDbVersion === 1) {
    console.log("[Database] Migrating version 1 to 2: Adding thumbnailUri...");
    await db.execAsync(`
      ALTER TABLE tickets ADD COLUMN thumbnailUri TEXT;
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);

  // 3. Handle Data Migration from AsyncStorage
  await migrateFromAsyncStorage(db);

  // 4. Handle Image Migration for existing SQLite entries
  await migrateSqliteImages(db);
};

/**
 * Safely migrates data from legacy AsyncStorage to SQLite.
 */
const migrateFromAsyncStorage = async (db: SQLite.SQLiteDatabase) => {
  try {
    const isMigrated = await AsyncStorage.getItem(ASYNC_STORAGE_MIGRATED_KEY);
    if (isMigrated === 'true') return;

    console.log("[Migration] Detected legacy data in AsyncStorage. Starting migration...");

    // Use the legacy storage helper which handles image migration and thumbnail generation
    const tickets = await getLegacyTickets();
    
    if (tickets.length === 0) {
      console.log("[Migration] No legacy data found or migration already completed.");
      await AsyncStorage.setItem(ASYNC_STORAGE_MIGRATED_KEY, 'true');
      return;
    }

    console.log(`[Migration] Migrating ${tickets.length} processed tickets to SQLite...`);

    // Use transaction for speed and safety
    await db.withTransactionAsync(async () => {
      for (const ticket of tickets) {
        await db.runAsync(
          'INSERT OR IGNORE INTO tickets (id, photoUri, thumbnailUri, title, note, location, date, timestamp, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          ticket.id,
          ticket.photoUri,
          ticket.thumbnailUri || null,
          ticket.title,
          ticket.note,
          ticket.location,
          ticket.date,
          ticket.timestamp,
          ticket.createdAt
        );
      }
    });

    console.log("[Migration] SQLite migration successful.");

    // Mark as migrated
    await AsyncStorage.setItem(ASYNC_STORAGE_MIGRATED_KEY, 'true');
    
    // We'll clear the original key after Phase 1 is confirmed stable
    await AsyncStorage.removeItem(TICKETS_KEY);
    
  } catch (error) {
    console.error("[Migration] Critical error during AsyncStorage to SQLite migration:", error);
  }
};

/**
 * Scans SQLite for any tickets with temporary URIs and migrates them.
 * This handles cases where users were already on SQLite but images weren't permanent.
 */
const migrateSqliteImages = async (db: SQLite.SQLiteDatabase) => {
  try {
    const isMigrated = await AsyncStorage.getItem(SQLITE_IMAGES_MIGRATED_KEY);
    if (isMigrated === 'true') return;

    console.log("[Migration] Checking SQLite for temporary image URIs...");
    const tickets = await db.getAllAsync<Ticket>('SELECT * FROM tickets');
    
    let migrationCount = 0;
    
    for (const ticket of tickets) {
      let needsUpdate = false;
      let updatedPhotoUri = ticket.photoUri;
      let updatedThumbUri = ticket.thumbnailUri;

      // 1. Migrate Photo
      if (ticket.photoUri && isTemporaryUri(ticket.photoUri)) {
        updatedPhotoUri = await migrateLegacyImage(ticket.id, ticket.photoUri);
        if (updatedPhotoUri !== ticket.photoUri) {
          needsUpdate = true;
          migrationCount++;
        }
      }

      // 2. Generate Thumbnail if missing or needs update
      if (updatedPhotoUri && (!updatedThumbUri || isTemporaryUri(updatedThumbUri))) {
        updatedThumbUri = await createThumbnail(updatedPhotoUri);
        if (updatedThumbUri !== ticket.thumbnailUri) {
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await db.runAsync(
          'UPDATE tickets SET photoUri = ?, thumbnailUri = ? WHERE id = ?',
          updatedPhotoUri,
          updatedThumbUri || null,
          ticket.id
        );
      }
    }

    if (migrationCount > 0) {
      console.log(`[Migration] Safeguarded ${migrationCount} images in SQLite.`);
    } else {
      console.log("[Migration] All SQLite images are already permanent.");
    }

    await AsyncStorage.setItem(SQLITE_IMAGES_MIGRATED_KEY, 'true');
  } catch (error) {
    console.error("[Migration] SQLite image migration failed:", error);
  }
};

/**
 * Typed CRUD operations for SQLite
 */
export const dbOps = {
  /**
   * Retrieves all tickets, sorted by timestamp.
   */
  getTickets: async (db: SQLite.SQLiteDatabase, sortBy: 'ASC' | 'DESC' = 'DESC'): Promise<Ticket[]> => {
    return await db.getAllAsync<Ticket>(
      `SELECT * FROM tickets ORDER BY timestamp ${sortBy}`
    );
  },

  /**
   * Adds a new ticket.
   */
  insertTicket: async (db: SQLite.SQLiteDatabase, ticket: Ticket) => {
    return await db.runAsync(
      'INSERT INTO tickets (id, photoUri, thumbnailUri, title, note, location, date, timestamp, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ticket.id,
      ticket.photoUri,
      ticket.thumbnailUri || null,
      ticket.title,
      ticket.note,
      ticket.location,
      ticket.date,
      ticket.timestamp,
      ticket.createdAt
    );
  },

  /**
   * Updates an existing ticket.
   */
  updateTicket: async (db: SQLite.SQLiteDatabase, ticket: Ticket) => {
    return await db.runAsync(
      'UPDATE tickets SET photoUri = ?, thumbnailUri = ?, title = ?, note = ?, location = ?, date = ? WHERE id = ?',
      ticket.photoUri,
      ticket.thumbnailUri || null,
      ticket.title,
      ticket.note,
      ticket.location,
      ticket.date,
      ticket.id
    );
  },

  /**
   * Deletes a ticket.
   */
  deleteTicket: async (db: SQLite.SQLiteDatabase, id: string) => {
    return await db.runAsync('DELETE FROM tickets WHERE id = ?', id);
  },
  
  /**
   * Search tickets by title, location or note.
   */
  searchTickets: async (db: SQLite.SQLiteDatabase, query: string, sortBy: 'ASC' | 'DESC' = 'DESC'): Promise<Ticket[]> => {
    const searchTerm = `%${query}%`;
    return await db.getAllAsync<Ticket>(
      `SELECT * FROM tickets WHERE title LIKE ? OR location LIKE ? OR note LIKE ? ORDER BY timestamp ${sortBy}`,
      searchTerm,
      searchTerm,
      searchTerm
    );
  }
};
