import { writeFile, exists, mkdir, remove, stat, readDir } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { getImageUrl } from '../utils/image-utils';

const THUMBNAIL_SIZE = 300;
const THUMBNAIL_QUALITY = 0.8;

export type ThumbnailInfo = {
  sourcePath: string;
  thumbnailPath: string;
};

export const getThumbnailDir = async (): Promise<string> => {
  const appData = await appDataDir();
  const thumbDir = await join(appData, 'thumbnails');
  if (!(await exists(thumbDir))) {
    await mkdir(thumbDir, { recursive: true });
  }
  return thumbDir;
};

const blobToUint8Array = async (blob: Blob): Promise<Uint8Array> => {
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
};

const generateThumbnailBlob = (sourceUrl: string, maxSize = THUMBNAIL_SIZE): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
        'image/jpeg',
        THUMBNAIL_QUALITY
      );
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${sourceUrl}`));
    img.src = sourceUrl;
  });
};

export const generateThumbnail = async (
  sourceImagePath: string,
  comicId: string | number,
  pageNumber: number
): Promise<string> => {
  const thumbDir = await getThumbnailDir();
  const comicThumbDir = await join(thumbDir, comicId.toString());

  if (!(await exists(comicThumbDir))) {
    await mkdir(comicThumbDir, { recursive: true });
  }

  const thumbPath = await join(comicThumbDir, `${pageNumber}.jpg`);

  // Cache check
  if (await exists(thumbPath)) {
    try {
      const sourceStat = await stat(sourceImagePath);
      const thumbStat = await stat(thumbPath);

      // If source hasn't changed since thumbnail was created, skip
      if (sourceStat.mtime && thumbStat.mtime && sourceStat.mtime <= thumbStat.mtime) {
        return thumbPath;
      }
    } catch (e) {
      // If error (e.g. stat fails), regenerate to be safe
    }
  }

  const sourceUrl = getImageUrl(sourceImagePath);
  const blob = await generateThumbnailBlob(sourceUrl);
  const data = await blobToUint8Array(blob);
  await writeFile(thumbPath, data);

  return thumbPath;
};

export const deleteThumbnailsForComic = async (comicId: string | number): Promise<void> => {
  const thumbDir = await getThumbnailDir();
  const comicThumbDir = await join(thumbDir, comicId.toString());
  if (await exists(comicThumbDir)) {
    await remove(comicThumbDir, { recursive: true });
  }
};

export const cleanupOrphans = async (activeComicIds: (string | number)[]): Promise<void> => {
  const thumbDir = await getThumbnailDir();
  if (!(await exists(thumbDir))) return;

  const entries = await readDir(thumbDir);
  const activeIdsSet = new Set(activeComicIds.map((id) => id.toString()));

  for (const entry of entries) {
    if (entry.isDirectory && !activeIdsSet.has(entry.name)) {
      const fullPath = await join(thumbDir, entry.name);
      await remove(fullPath, { recursive: true });
    }
  }
};
