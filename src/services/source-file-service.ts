import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

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

export type IndexedPagePayload = {
  pageNumber: number;
  filePath: string;
  fileName: string;
  sourceType: 'image' | 'pdf' | 'archive';
  sourcePath: string;
  archiveEntryPath: string | null;
  pdfPageNumber: number | null;
  thumbnailPath: string | null;
};

export type IndexedComicPayload = {
  path: string;
  title: string;
  sourceType: 'image' | 'pdf' | 'archive';
  artist: string | null;
  series: string | null;
  issue: string | null;
  coverImagePath: string | null;
  pageCount: number;
  pages: IndexedPagePayload[];
};

export type BuildIndexPayloadResult = {
  comics: IndexedComicPayload[];
  activeComicPaths: string[];
  errors: { path: string; message: string }[];
};

export type RustIndexingProgressEvent = {
  basePath: string;
  totalComics: number;
  currentComic: number;
  currentPath: string;
  percentage: number;
  currentTask: string;
};

export type ScanResult = {
  candidates: ComicCandidate[];
  errors: { path: string; message: string }[];
};

export const scanComicCandidates = async (basePath: string): Promise<ScanResult> => {
  return await invoke<ScanResult>('scan_comic_candidates', { basePath });
};

export const buildIndexPayloadForPath = async (
  basePath: string,
  pattern: string
): Promise<BuildIndexPayloadResult> => {
  return await invoke<BuildIndexPayloadResult>('build_index_payload_for_path', { basePath, pattern });
};

export const getComicPages = async (
  basePath: string,
  totalComics: number,
  currentComic: number,
  comicPath: string,
  sourceType: string
): Promise<IndexedPagePayload[]> => {
  return await invoke<IndexedPagePayload[]>('get_comic_pages', {
    basePath,
    totalComics,
    currentComic,
    comicPath,
    sourceType,
  });
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

export const cleanupIndexedThumbnails = async (activeComicPaths: string[]): Promise<void> => {
  await invoke('cleanup_indexed_thumbnails', { activeComicPaths });
};

export const listenToRustIndexingProgress = async (
  onEvent: (event: RustIndexingProgressEvent) => void
): Promise<UnlistenFn> => {
  return await listen<RustIndexingProgressEvent>('indexing-progress', (event) => {
    onEvent(event.payload);
  });
};
