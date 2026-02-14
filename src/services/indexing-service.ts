import { readDir } from '@tauri-apps/plugin-fs';
import { join, basename } from '@tauri-apps/api/path';
import { naturalSortComparator, normalizePath } from '../utils/image-utils';
import * as comicService from './comic-service';
import * as pageService from './comic-page-service';
import * as thumbnailService from './thumbnail-service';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

/**
 * Poor man's relative path implementation since @tauri-apps/api/path might not export it.
 */
const getRelativePath = (from: string, to: string): string => {
  const fromNorm = normalizePath(from);
  const toNorm = normalizePath(to);
  if (toNorm.startsWith(fromNorm)) {
    let rel = toNorm.slice(fromNorm.length);
    if (rel.startsWith('/')) rel = rel.slice(1);
    return rel;
  }
  return toNorm;
};

export type IndexedPage = {
  filePath: string;
  fileName: string;
  pageNumber: number;
  thumbnailPath: string;
};

export type IndexedComic = {
  path: string;
  title: string;
  artist: string | null;
  series: string | null;
  issue: string | null;
  coverImagePath: string;
  pages: IndexedPage[];
};

export type IndexingProgress = {
  current: number;
  total: number;
  currentPath: string;
};

/**
 * Checks if the file is an image based on extension.
 */
export const isImageFile = (fileName: string): boolean => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return !!ext && IMAGE_EXTENSIONS.includes(ext);
};

/**
 * Extracts variable names from a pattern like {artist}/{series}/{issue}.
 */
export const parsePattern = (pattern: string): string[] => {
  const matches = pattern.match(/\{([^}]+)\}/g);
  return matches ? matches.map((m) => m.slice(1, -1)) : [];
};

/**
 * Extracts metadata from a relative path based on pattern variables.
 */
export const extractMetadata = (relativePath: string, pattern: string): Record<string, string | null> => {
  const patternVars = parsePattern(pattern);
  const patternSegments = pattern.split(/[\\/]/);
  const pathSegments = normalizePath(relativePath).split('/');
  
  const metadata: Record<string, string | null> = {};
  
  // Initialize all pattern variables to null
  patternVars.forEach(v => metadata[v] = null);

  // Map path segments to pattern variables by position
  patternSegments.forEach((segment, index) => {
    const varMatch = segment.match(/^\{([^}]+)\}$/);
    if (varMatch && pathSegments[index]) {
      metadata[varMatch[1]] = pathSegments[index];
    }
  });

  return metadata;
};

/**
 * Walks a directory recursively and returns all folders that contain images.
 */
const walkDirectory = async (dirPath: string): Promise<string[]> => {
  const entries = await readDir(dirPath);
  const comicDirs: string[] = [];
  let containsImages = false;

  for (const entry of entries) {
    const fullPath = await join(dirPath, entry.name);
    if (entry.isDirectory) {
      const nestedComicDirs = await walkDirectory(fullPath);
      comicDirs.push(...nestedComicDirs);
    } else if (entry.isFile && isImageFile(entry.name)) {
      containsImages = true;
    }
  }

  if (containsImages) {
    comicDirs.push(dirPath);
  }

  return comicDirs;
};

/**
 * Scans a base path and returns a list of indexed comics.
 */
export const scanDirectory = async (basePath: string, pattern: string): Promise<IndexedComic[]> => {
  const comicPaths = await walkDirectory(basePath);
  const indexedComics: IndexedComic[] = [];

  for (const comicPath of comicPaths) {
    const relPath = getRelativePath(basePath, comicPath);
    const metadata = extractMetadata(relPath, pattern);
    const entries = await readDir(comicPath);
    
    const imageFiles = entries
      .filter((e) => e.isFile && isImageFile(e.name))
      .map((e) => e.name)
      .sort(naturalSortComparator);

    if (imageFiles.length === 0) continue;

    const pages: IndexedPage[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
        const fileName = imageFiles[i];
        const filePath = await join(comicPath, fileName);
        pages.push({
            filePath: normalizePath(filePath),
            fileName,
            pageNumber: i + 1,
            thumbnailPath: '' // Will be filled during indexing
        });
    }

    indexedComics.push({
      path: normalizePath(comicPath),
      title: await basename(comicPath),
      artist: metadata.artist || null,
      series: metadata.series || null,
      issue: metadata.issue || null,
      coverImagePath: pages[0].filePath,
      pages,
    });
  }

  return indexedComics;
};

/**
 * Orchestrates the indexing of a single index path.
 */
export const indexComics = async (
  basePath: string,
  pattern: string,
  onProgress?: (progress: IndexingProgress) => void
): Promise<void> => {
  const comics = await scanDirectory(basePath, pattern);
  const total = comics.length;
  const activeComicPaths = new Set<string>();

  for (let i = 0; i < total; i++) {
    const indexedComic = comics[i];
    onProgress?.({
      current: i + 1,
      total,
      currentPath: indexedComic.path,
    });

    // 1. Upsert comic
    const comicId = await comicService.upsertComic({
      path: indexedComic.path,
      title: indexedComic.title,
      artist: indexedComic.artist,
      series: indexedComic.series,
      issue: indexedComic.issue,
      cover_image_path: indexedComic.coverImagePath,
      page_count: indexedComic.pages.length,
      is_favorite: 0, // Ignored by upsert anyway
      view_count: 0,  // Ignored by upsert anyway
    });

    activeComicPaths.add(indexedComic.path);

    // 2. Generate thumbnails and update page paths
    const pagesWithThumbs = [];
    for (const page of indexedComic.pages) {
      const thumbPath = await thumbnailService.generateThumbnail(
        page.filePath,
        comicId,
        page.pageNumber
      );
      pagesWithThumbs.push({
        ...page,
        thumbnailPath: normalizePath(thumbPath),
      });
    }

    // 3. Insert pages
    await pageService.insertPages(comicId, pagesWithThumbs.map(p => ({
      page_number: p.pageNumber,
      file_path: p.filePath,
      file_name: p.fileName,
      thumbnail_path: p.thumbnailPath
    })));
  }

  // 4. Cleanup removed comics (within this base path)
  const allDbComics = await comicService.getAllComics();
  const baseNormalized = normalizePath(basePath);
  
  for (const dbComic of allDbComics) {
    if (dbComic.path.startsWith(baseNormalized) && !activeComicPaths.has(dbComic.path)) {
      await comicService.deleteComic(dbComic.id);
      await thumbnailService.deleteThumbnailsForComic(dbComic.id);
    }
  }

  // 5. Cleanup orphaned thumbnails globally
  const remainingComics = await comicService.getAllComics();
  await thumbnailService.cleanupOrphans(remainingComics.map(c => c.id));
};
