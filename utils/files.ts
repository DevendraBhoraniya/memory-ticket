import { Directory, File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Permanent directories for ticket images and thumbnails.
 */
export const TICKETS_DIR = new Directory(Paths.document, 'tickets');
export const THUMBS_DIR = new Directory(Paths.document, 'thumbnails');

/**
 * Ensures the required storage directories exist.
 */
export const ensureStorageDirectories = async () => {
  try {
    if (!TICKETS_DIR.exists) {
      console.log("[Files] Creating tickets directory...");
      await TICKETS_DIR.create();
    }
    if (!THUMBS_DIR.exists) {
      console.log("[Files] Creating thumbnails directory...");
      await THUMBS_DIR.create();
    }
  } catch (error) {
    console.error("[Files] Failed to prepare storage directories:", error);
  }
};

/**
 * Checks if a file exists at the given URI.
 */
export const fileExists = async (uri: string): Promise<boolean> => {
  try {
    const file = new File(uri);
    return file.exists;
  } catch {
    return false;
  }
};

/**
 * Generates a lightweight thumbnail for the Archive grid.
 */
export const createThumbnail = async (imageUri: string): Promise<string | undefined> => {
  try {
    await ensureStorageDirectories();

    // Verify source exists
    if (!(await fileExists(imageUri))) {
      console.warn(`[Files] Cannot create thumbnail: source missing at ${imageUri}`);
      return undefined;
    }

    console.log(`[Files] Generating thumbnail for: ${imageUri}`);
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 400 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Save to permanent thumbnails directory
    const filename = `thumb_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const targetFile = new File(THUMBS_DIR, filename);
    
    const sourceFile = new File(result.uri);
    await sourceFile.move(targetFile);

    console.log(`[Files] Thumbnail created: ${targetFile.uri}`);
    return targetFile.uri;
  } catch (error) {
    console.warn("[Files] Thumbnail generation failed:", error);
    return undefined;
  }
};

/**
 * Copies an image from a temporary URI to permanent app storage.
 * Returns the permanent URI.
 */
export const saveImagePermanently = async (tempUri: string): Promise<string> => {
  try {
    await ensureStorageDirectories();

    // Verify source exists before attempting copy
    if (!(await fileExists(tempUri))) {
      console.error(`[Files] Failed to safeguard memory: source file missing at ${tempUri}`);
      throw new Error("Original image file not found in cache.");
    }

    // Generate a unique, collision-resistant filename
    const extension = tempUri.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = `stub_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
    
    // Create modern File instances for source and destination
    const sourceFile = new File(tempUri);
    const targetFile = new File(TICKETS_DIR, filename);

    console.log(`[Files] Safeguarding memory to: ${targetFile.uri}`);
    await sourceFile.copy(targetFile);

    return targetFile.uri;
  } catch (error) {
    console.error("[Files] Image preservation failed:", error);
    throw new Error("Could not safeguard your memory image.");
  }
};

/**
 * Deletes an image file and its optional thumbnail using the modern File API.
 */
export const deleteFile = async (uri: string) => {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) {
      console.log(`[Files] Removing preserved file: ${uri}`);
      await file.delete();
    }
  } catch (error) {
    console.warn(`[Files] Cleanup failed for ${uri}:`, error);
  }
};

/**
 * Checks if a URI points to a temporary cache location.
 * Now more robust by checking if it's outside our permanent storage.
 */
export const isTemporaryUri = (uri: string): boolean => {
  if (!uri) return false;
  
  // 1. Explicit cache indicators
  const normalized = uri.toLowerCase();
  const isCachePath = (
    normalized.includes('imagepicker') || 
    normalized.includes('camera') || 
    normalized.includes('tmp') || 
    normalized.includes('cache')
  );
  
  if (isCachePath) return true;

  // 2. Location-based check (is it outside our tickets directory?)
  // On iOS/Android, permanent storage is in the document directory
  const ticketsDirUri = TICKETS_DIR.uri.toLowerCase();
  const thumbsDirUri = THUMBS_DIR.uri.toLowerCase();
  
  return !normalized.startsWith(ticketsDirUri) && !normalized.startsWith(thumbsDirUri);
};

/**
 * Migration helper to move legacy cached images to permanent storage.
 */
export const migrateLegacyImage = async (ticketId: string, legacyUri: string): Promise<string> => {
  if (isTemporaryUri(legacyUri)) {
    console.log(`[Files] Migrating legacy image for stub: ${ticketId}`);
    try {
      // Check if file still exists in cache before migrating
      if (await fileExists(legacyUri)) {
        return await saveImagePermanently(legacyUri);
      } else {
        console.warn(`[Files] Cannot migrate: legacy file gone for stub ${ticketId}`);
        return legacyUri; // Keep the URI, UI will handle the missing state
      }
    } catch (error) {
      console.warn(`[Files] Migration failed for stub ${ticketId}:`, error);
      return legacyUri; 
    }
  }
  return legacyUri;
};
