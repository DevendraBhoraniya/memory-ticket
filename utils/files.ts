import * as FileSystem from 'expo-file-system/legacy';
import { optimizeImage } from './image';

const TICKETS_DIR = `${FileSystem.documentDirectory}tickets/`;

export const saveImagePermanently = async (tempUri: string): Promise<string> => {
  const filename = tempUri.split('/').pop();
  const permanentUri = `${TICKETS_DIR}${filename}`;

  try {
    const dirInfo = await FileSystem.getInfoAsync(TICKETS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(TICKETS_DIR, { intermediates: true });
    }

    await FileSystem.copyAsync({ from: tempUri, to: permanentUri });
    return permanentUri;
  } catch (error) {
    console.error('Failed to move image to permanent storage:', error);
    return tempUri;
  }
};

export const saveAndOptimizeImage = async (
  uri: string,
): Promise<{ photoUri: string; thumbnailUri: string }> => {
  const { optimizedUri, thumbnailUri } = await optimizeImage(uri);

  const filename = `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const photoDest = `${TICKETS_DIR}${filename}.jpg`;
  const thumbDest = `${TICKETS_DIR}${filename}_thumb.jpg`;

  const dirInfo = await FileSystem.getInfoAsync(TICKETS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(TICKETS_DIR, { intermediates: true });
  }

  await Promise.all([
    FileSystem.moveAsync({ from: optimizedUri, to: photoDest }),
    FileSystem.moveAsync({ from: thumbnailUri, to: thumbDest }),
  ]);

  return { photoUri: photoDest, thumbnailUri: thumbDest };
};

export const deleteImageFiles = async (...uris: string[]): Promise<void> => {
  await Promise.all(
    uris.map(uri =>
      FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {}),
    ),
  );
};

export const clearAllImageFiles = async (): Promise<void> => {
  const dirs = [
    TICKETS_DIR,
    `${FileSystem.documentDirectory}optimized/`,
  ];
  for (const dir of dirs) {
    try {
      const info = await FileSystem.getInfoAsync(dir);
      if (info.exists && info.isDirectory) {
        await FileSystem.deleteAsync(dir, { idempotent: true });
      }
    } catch {
      // best-effort cleanup
    }
  }
};
