import { readDir } from '@tauri-apps/plugin-fs';
import { join, basename } from '@tauri-apps/api/path';
import { naturalSortComparator, normalizePath, isSubPath } from '../utils/image-utils';
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

export type IndexingError = {
  path: string;
  message: string;
};

export type IndexingProgress = {
  current: number;
  total: number;
  currentPath: string;
  errors: IndexingError[];
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
const walkDirectory = async (dirPath: string, onError?: (path: string, error: any) => void): Promise<string[]> => {
  try {
    const entries = await readDir(dirPath);
    const comicDirs: string[] = [];
    let containsImages = false;

    for (const entry of entries) {
      const fullPath = await join(dirPath, entry.name);
      if (entry.isDirectory) {
        const nestedComicDirs = await walkDirectory(fullPath, onError);
        comicDirs.push(...nestedComicDirs);
      } else if (entry.isFile && isImageFile(entry.name)) {
        containsImages = true;
      }
    }

    if (containsImages) {
      comicDirs.push(dirPath);
    }

    return comicDirs;
  } catch (error) {
    console.error(`Failed to read directory ${dirPath}:`, error);
    onError?.(dirPath, error);
    return [];
  }
};

/**
 * Orchestrates the indexing of a single index path.
 */
export const indexComics = async (
  basePath: string,
  pattern: string,
  onProgress?: (progress: IndexingProgress) => void
): Promise<Set<string>> => {
  const errors: IndexingError[] = [];
  
  const comicPaths = await walkDirectory(basePath, (path, err) => {
    errors.push({
        path: normalizePath(path),
        message: err instanceof Error ? err.message : String(err)
    });
    // Send progress update when a scan error occurs
    onProgress?.({
        current: 0,
        total: 0,
        currentPath: path,
        errors: [...errors]
    });
  });

  const total = comicPaths.length;
  const activeComicPaths = new Set<string>();

  for (let i = 0; i < total; i++) {
    const comicPath = comicPaths[i];
    const normalizedComicPath = normalizePath(comicPath);
    
    onProgress?.({
      current: i + 1,
      total,
      currentPath: normalizedComicPath,
      errors: [...errors],
    });

    try {
      // 1. Scan individual comic directory
      const relPath = getRelativePath(basePath, comicPath);
      const metadata = extractMetadata(relPath, pattern);
      const entries = await readDir(comicPath);
      
      const imageFiles = entries
        .filter((e) => e.isFile && isImageFile(e.name))
        .map((e) => e.name)
        .sort(naturalSortComparator);

      if (imageFiles.length === 0) {
          // Folder has no images, skip it but don't count as "error" necessarily 
          // unless one was expected. walkDirectory already filters for folders with images though.
          continue;
      }

      const pages: IndexedPage[] = [];
      for (let j = 0; j < imageFiles.length; j++) {
          const fileName = imageFiles[j];
          const filePath = await join(comicPath, fileName);
          pages.push({
              filePath: normalizePath(filePath),
              fileName,
              pageNumber: j + 1,
              thumbnailPath: '' 
          });
      }

      // 2. Upsert comic
      const comicId = await comicService.upsertComic({
        path: normalizedComicPath,
        title: await basename(comicPath),
        artist: metadata.artist || null,
        series: metadata.series || null,
        issue: metadata.issue || null,
        cover_image_path: pages[0].filePath,
        page_count: pages.length,
        is_favorite: 0, 
        view_count: 0,  
      });

      // 3. Generate thumbnails and update page paths
      const pagesWithThumbs = [];
      for (const page of pages) {
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

      // 4. Insert pages
      await pageService.insertPages(comicId, pagesWithThumbs.map(p => ({
        page_number: p.pageNumber,
        file_path: p.filePath,
        file_name: p.fileName,
        thumbnail_path: p.thumbnailPath
      })));

      activeComicPaths.add(normalizedComicPath);
    } catch (err) {
      console.error(`Error indexing comic at ${comicPath}:`, err);
      errors.push({
        path: normalizedComicPath,
        message: err instanceof Error ? err.message : String(err),
      });
      // Notify about the error immediately
      onProgress?.({
        current: i + 1,
        total,
        currentPath: normalizedComicPath,
        errors: [...errors],
      });
    }
  }

  // 5. Cleanup removed comics (within this base path)
  const allDbComics = await comicService.getAllComics();
  
  for (const dbComic of allDbComics) {
    if (isSubPath(basePath, dbComic.path) && !activeComicPaths.has(dbComic.path)) {
      await comicService.deleteComic(dbComic.id);
      await thumbnailService.deleteThumbnailsForComic(dbComic.id);
    }
  }

  // 6. Cleanup orphaned thumbnails globally
  const remainingComics = await comicService.getAllComics();
  await thumbnailService.cleanupOrphans(remainingComics.map(c => c.id));

  return activeComicPaths;
};
