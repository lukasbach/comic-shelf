import { invoke } from '@tauri-apps/api/core';

export type ComicCandidate = {
  path: string;
  title: string;
  sourceType: 'image' | 'pdf' | 'archive';
};

export type ImagePageEntry = {
  filePath: string;
  fileName: string;
  pageNumber: number;
};

export const scanComicCandidates = async (basePath: string): Promise<ComicCandidate[]> => {
  return await invoke<ComicCandidate[]>('scan_comic_candidates', { basePath });
};

export const listImagePages = async (comicDirPath: string): Promise<ImagePageEntry[]> => {
  return await invoke<ImagePageEntry[]>('list_image_pages', { comicDirPath });
};

export const readBinaryFile = async (path: string): Promise<Uint8Array> => {
  const bytes = await invoke<number[]>('read_binary_file', { path });
  return new Uint8Array(bytes);
};

export const countPdfPages = async (path: string): Promise<number> => {
  return await invoke<number>('count_pdf_pages', { path });
};

export const listArchiveImageEntries = async (path: string): Promise<string[]> => {
  return await invoke<string[]>('list_archive_image_entries', { path });
};

export const readArchiveImageEntry = async (path: string, entryPath: string): Promise<Uint8Array> => {
  const bytes = await invoke<number[]>('read_archive_image_entry', { path, entryPath });
  return new Uint8Array(bytes);
};

export const readArchiveImageEntriesBatch = async (path: string, entryPaths: string[]): Promise<Uint8Array[]> => {
  const entries = await invoke<number[][]>('read_archive_image_entries_batch', { path, entryPaths });
  return entries.map((bytes) => new Uint8Array(bytes));
};
