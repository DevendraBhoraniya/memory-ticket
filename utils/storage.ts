import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ticket } from '../types';
import { deleteImageFiles } from './files';

const TICKETS_KEY = '@vault_records';
const PENDING_DELETE_KEY = '@vault_pending_delete';
const DESIGN_PREF_KEY = '@system_design_variant'; // 'postal' | 'instant'
const ACCENT_COLOR_KEY = '@system_accent_color';
const CUSTOM_CATEGORIES_KEY = '@vault_categories';
const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';

const UNDO_WINDOW_MS = 6000;

export interface PendingDelete {
  ticket: Ticket;
  expiresAt: number;
}

const INITIAL_CATEGORIES = ['Travel', 'Music', 'Food', 'Nature', 'Art'];

// Defensively parse JSON with fallback support
const safeParse = <T>(data: string | null, fallback: T): T => {
  if (!data) return fallback;
  try {
    const parsed = JSON.parse(data);
    return parsed ?? fallback;
  } catch (error) {
    console.error('Storage Corruption Detected (JSON):', error);
    return fallback;
  }
};

// Individual function exports for maximum reliability
export const setDesignVariant = async (variant: 'postal' | 'instant'): Promise<void> => {
  try {
    await AsyncStorage.setItem(DESIGN_PREF_KEY, variant);
  } catch (error) {
    console.error('Failed to save design variant:', error);
  }
};

export const getDesignVariant = async (): Promise<'postal' | 'instant'> => {
  try {
    const variant = await AsyncStorage.getItem(DESIGN_PREF_KEY);
    return (variant as 'postal' | 'instant') || 'postal';
  } catch {
    return 'postal';
  }
};

export const setAccentColor = async (color: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACCENT_COLOR_KEY, color);
  } catch (error) {
    console.error('Failed to save accent color:', error);
  }
};

export const getAccentColor = async (): Promise<string> => {
  try {
    const color = await AsyncStorage.getItem(ACCENT_COLOR_KEY);
    return color || '#D9C5B2';
  } catch {
    return '#D9C5B2';
  }
};

export const getCategories = async (): Promise<string[]> => {
  try {
    const saved = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
    return safeParse(saved, INITIAL_CATEGORIES);
  } catch {
    return INITIAL_CATEGORIES;
  }
};

export const addCategory = async (category: string): Promise<void> => {
  try {
    const existing = await getCategories();
    if (!existing.includes(category)) {
      const updated = [...existing, category];
      await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Failed to add category:', error);
  }
};

export const getTickets = async (): Promise<Ticket[]> => {
  try {
    const data = await AsyncStorage.getItem(TICKETS_KEY);
    return safeParse(data, []);
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    return [];
  }
};

export const saveTicket = async (ticket: Ticket): Promise<void> => {
  try {
    const existing = await getTickets();
    const updated = [ticket, ...existing];
    await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save ticket:', error);
    throw error;
  }
};

export const saveTicketsBatch = async (tickets: Ticket[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  } catch (error) {
    console.error('Failed to save tickets batch:', error);
    throw error;
  }
};

export const deleteTicket = async (id: string): Promise<void> => {
  try {
    const existing = await getTickets();
    const filtered = existing.filter(t => t.id !== id);
    await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete ticket:', error);
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      TICKETS_KEY,
      DESIGN_PREF_KEY,
      ACCENT_COLOR_KEY,
      CUSTOM_CATEGORIES_KEY,
      ONBOARDING_COMPLETED_KEY,
    ]);
  } catch (error) {
    console.error('Failed to clear all data:', error);
    throw error;
  }
};

export const getOnboardingStatus = async (): Promise<boolean> => {
  try {
    const status = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    return status === 'true';
  } catch {
    return false;
  }
};

export const setOnboardingCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
  } catch (error) {
    console.error('Failed to set onboarding status:', error);
  }
};

export const softDeleteTicket = async (id: string): Promise<Ticket | null> => {
  try {
    const existing = await getTickets();
    const target = existing.find(t => t.id === id);
    if (!target) return null;

    const filtered = existing.filter(t => t.id !== id);
    await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(filtered));

    const pending = await getPendingDeletions();
    pending.push({ ticket: target, expiresAt: Date.now() + UNDO_WINDOW_MS });
    await AsyncStorage.setItem(PENDING_DELETE_KEY, JSON.stringify(pending));

    return target;
  } catch (error) {
    console.error('Failed to soft-delete ticket:', error);
    return null;
  }
};

export const undoDelete = async (id: string): Promise<boolean> => {
  try {
    const pending = await getPendingDeletions();
    const idx = pending.findIndex(p => p.ticket.id === id);
    if (idx === -1) return false;

    const [entry] = pending.splice(idx, 1);
    await AsyncStorage.setItem(PENDING_DELETE_KEY, JSON.stringify(pending));

    const existing = await getTickets();
    existing.unshift(entry.ticket);
    await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(existing));

    return true;
  } catch (error) {
    console.error('Failed to undo delete:', error);
    return false;
  }
};

export const getPendingDeletions = async (): Promise<PendingDelete[]> => {
  try {
    const data = await AsyncStorage.getItem(PENDING_DELETE_KEY);
    return safeParse<PendingDelete[]>(data, []);
  } catch {
    return [];
  }
};

export const flushExpiredDeletes = async (): Promise<Ticket[]> => {
  try {
    const pending = await getPendingDeletions();
    const now = Date.now();
    const expired = pending.filter(p => p.expiresAt <= now);
    const remaining = pending.filter(p => p.expiresAt > now);

    await AsyncStorage.setItem(PENDING_DELETE_KEY, JSON.stringify(remaining));

    for (const p of expired) {
      const files = [p.ticket.photoUri, p.ticket.thumbnailUri].filter(Boolean) as string[];
      if (files.length > 0) {
        deleteImageFiles(...files);
      }
    }

    return expired.map(p => p.ticket);
  } catch {
    return [];
  }
};

export const getAllUsedUris = async (): Promise<Set<string>> => {
  const uris = new Set<string>();
  try {
    const tickets = await getTickets();
    for (const t of tickets) {
      if (t.photoUri) uris.add(t.photoUri);
      if (t.thumbnailUri) uris.add(t.thumbnailUri);
    }
  } catch {
    // best-effort
  }
  return uris;
};

export const storage = {
  setDesignVariant,
  getDesignVariant,
  setAccentColor,
  getAccentColor,
  getCategories,
  addCategory,
  getTickets,
  saveTicket,
  saveTicketsBatch,
  deleteTicket,
  softDeleteTicket,
  undoDelete,
  getPendingDeletions,
  flushExpiredDeletes,
  clearAllData,
  getAllUsedUris,
};
