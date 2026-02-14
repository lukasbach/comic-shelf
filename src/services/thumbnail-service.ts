import { invoke } from '@tauri-apps/api/core';

export const generateThumbnail = async (
  sourceImagePath: string,
  comicId: string | number,
  pageNumber: number
): Promise<string> => {
  return await invoke<string>('generate_thumbnail_from_path', {
    sourceImagePath,
    comicId: Number(comicId),
    pageNumber,
  });
};

export const generateThumbnailFromBytes = async (
  imageBytes: Uint8Array,
  comicId: string | number,
  pageNumber: number
): Promise<string> => {
  return await invoke<string>('generate_thumbnail_from_bytes', {
    imageBytes: Array.from(imageBytes),
    comicId: Number(comicId),
    pageNumber,
  });
};

export const deleteThumbnailsForComic = async (comicId: string | number): Promise<void> => {
  await invoke('delete_thumbnails_for_comic', { comicId: Number(comicId) });
};

export const cleanupOrphans = async (activeComicIds: (string | number)[]): Promise<void> => {
  await invoke('cleanup_orphan_thumbnails', {
    activeComicIds: activeComicIds.map((id) => Number(id)),
  });
};
