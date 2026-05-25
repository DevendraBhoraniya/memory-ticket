import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const MAX_DIMENSION = 1920;
const THUMB_DIMENSION = 400;

export const optimizeImage = async (
  uri: string,
): Promise<{ optimizedUri: string; thumbnailUri: string }> => {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    return { optimizedUri: uri, thumbnailUri: uri };
  }

  const dir = `${FileSystem.documentDirectory}optimized/`;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  const baseName = uri.split('/').pop() || `img_${Date.now()}`;
  const nameRoot = baseName.replace(/\.[^.]+$/, '');

  const [optimized, thumb] = await Promise.all([
    manipulateAsync(
      uri,
      [{ resize: { width: MAX_DIMENSION } }],
      { compress: 0.82, format: SaveFormat.JPEG },
    ),
    manipulateAsync(
      uri,
      [{ resize: { width: THUMB_DIMENSION } }],
      { compress: 0.7, format: SaveFormat.JPEG },
    ),
  ]);

  const optimizedDest = `${dir}${nameRoot}_opt.jpg`;
  const thumbDest = `${dir}${nameRoot}_thumb.jpg`;

  await Promise.all([
    FileSystem.moveAsync({ from: optimized.uri, to: optimizedDest }),
    FileSystem.moveAsync({ from: thumb.uri, to: thumbDest }),
  ]);

  return { optimizedUri: optimizedDest, thumbnailUri: thumbDest };
};

export const cleanupOrphanedImages = async (usedUris: Set<string>): Promise<void> => {
  try {
    const dirs = [
      `${FileSystem.documentDirectory}optimized/`,
      `${FileSystem.documentDirectory}tickets/`,
    ];
    for (const dir of dirs) {
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists || !dirInfo.isDirectory) continue;
      const files = await FileSystem.readDirectoryAsync(dir);
      for (const file of files) {
        const fullPath = `${dir}${file}`;
        if (!usedUris.has(fullPath)) {
          await FileSystem.deleteAsync(fullPath, { idempotent: true });
        }
      }
    }
  } catch {
    // cleanup is best-effort
  }
};
