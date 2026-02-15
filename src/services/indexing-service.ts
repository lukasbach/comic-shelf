import * as comicService from './comic-service';
import * as pageService from './comic-page-service';
import { getAllIndexPaths } from './index-path-service';
import {
    buildIndexPayloadForPath,
    cleanupIndexedThumbnails,
    listenToRustIndexingProgress,
    type IndexedComicPayload,
    type IndexedPagePayload,
} from './source-file-service';
import * as thumbnailService from './thumbnail-service';
import { renderPdfPagesToPngBytes } from './page-source-utils';
import { isSubPath, normalizePath } from '../utils/image-utils';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

export type IndexingError = {
  path: string;
  message: string;
};

export type IndexingProgress = {
  current: number;
  total: number;
  currentPath: string;
  percentage?: number;
  currentTask?: string;
  errors: IndexingError[];
};

export type GlobalIndexingProgress = {
  status: 'scanning' | 'indexing' | 'cleanup';
  currentPathIndex: number;
  totalPaths: number;
  current?: number;
  total?: number;
  currentPath?: string;
  percentage?: number;
  currentTask?: string;
  errors: IndexingError[];
};

export const isImageFile = (fileName: string): boolean => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return !!ext && IMAGE_EXTENSIONS.includes(ext);
};

export const parsePattern = (pattern: string): string[] => {
  const matches = pattern.match(/\{([^}]+)\}/g);
  return matches ? matches.map((m) => m.slice(1, -1)) : [];
};

export const extractMetadata = (relativePath: string, pattern: string): Record<string, string | null> | null => {
  const normalizedPath = normalizePath(relativePath);
  const patternSegments = pattern.split(/[\\/]/).filter(s => s !== '');

  const metadata: Record<string, string | null> = {
    artist: null,
    series: null,
    issue: null,
  };

  let regexStr = '^';
  const placeholders: string[] = [];
  const placeholderRegex = /\{([^}]+)\}/g;
  let skipNextSlash = false;

  for (let i = 0; i < patternSegments.length; i++) {
    const segment = patternSegments[i];

    if (i > 0 && !skipNextSlash) {
      regexStr += '/';
    }
    skipNextSlash = false;

    if (segment === '**') {
      if (i < patternSegments.length - 1) {
        regexStr += '(?:.*/)?';
        skipNextSlash = true;
      } else {
        regexStr += '.*';
      }
    } else {
      let lastIdx = 0;
      let match;
      while ((match = placeholderRegex.exec(segment)) !== null) {
        const literal = segment.substring(lastIdx, match.index);
        regexStr += literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const varName = match[1];
        const captureName = (varName === 'author' || varName === 'artist') ? 'artist' : varName;
        placeholders.push(captureName);

        regexStr += '([^/]+?)';
        lastIdx = placeholderRegex.lastIndex;
      }
      regexStr += segment.substring(lastIdx).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  regexStr += '$';

  const re = new RegExp(regexStr);
  const m = normalizedPath.match(re);

  if (m) {
    placeholders.forEach((name, idx) => {
      if (name in metadata) {
        metadata[name] = m[idx + 1];
      }
    });
    return metadata;
  }

  return null;
};

const generatePdfFallbackThumbnails = async (
  pages: IndexedPagePayload[],
  comicId: number,
  existingThumbnailByPageNumber: Map<number, string>,
  onProgress?: (current: number, total: number) => void
): Promise<Map<number, string | null>> => {
  const output = new Map<number, string | null>();
  if (pages.length === 0 || pages[0]?.sourceType !== 'pdf') {
    return output;
  }

  pages.forEach((page) => {
    const existingThumb = existingThumbnailByPageNumber.get(page.pageNumber);
    if (existingThumb) {
      output.set(page.pageNumber, normalizePath(existingThumb));
    }
  });

  const pagesToGenerate = pages.filter((page) => !output.has(page.pageNumber));
  if (pagesToGenerate.length === 0) {
    return output;
  }

  const sourcePath = normalizePath(pagesToGenerate[0].sourcePath || pagesToGenerate[0].filePath);
  const pageNumbers = pagesToGenerate.map((page) => page.pdfPageNumber ?? page.pageNumber);
  
  // Create a map for fast lookup of pages by their PDF page number
  const pageByPdfPageNumber = new Map<number, IndexedPagePayload>();
  pagesToGenerate.forEach(p => {
    pageByPdfPageNumber.set(p.pdfPageNumber ?? p.pageNumber, p);
  });
  
  let current = 0;
  const total = pagesToGenerate.length;

  await renderPdfPagesToPngBytes(sourcePath, pageNumbers, async (pageNumber, bytes) => {
    current++;
    onProgress?.(current, total);

    const page = pageByPdfPageNumber.get(pageNumber);
    if (page) {
      try {
        const thumb = await thumbnailService.generateThumbnailFromBytes(bytes, comicId, page.pageNumber);
        if (thumb) {
          output.set(page.pageNumber, normalizePath(thumb));
        } else {
          console.warn(`[Indexing] thumbnailService returned empty path for PDF page ${pageNumber}`);
          output.set(page.pageNumber, null);
        }
      } catch (err) {
        console.error(`[Indexing] Failed to generate thumbnail for PDF page ${pageNumber}`, err);
        output.set(page.pageNumber, null);
      }
    } else {
      console.warn(`[Indexing] Could not find page payload mapping for PDF page ${pageNumber}`);
    }
  });

  return output;
};

const insertIndexedComic = async (comic: IndexedComicPayload, comicId: number): Promise<void> => {
  await pageService.insertPages(
    comicId,
    comic.pages.map((page) => ({
      page_number: page.pageNumber,
      file_path: normalizePath(page.filePath),
      file_name: page.fileName,
      source_type: page.sourceType,
      source_path: normalizePath(page.sourcePath ?? page.filePath),
      archive_entry_path: page.archiveEntryPath,
      pdf_page_number: page.pdfPageNumber,
      thumbnail_path: page.thumbnailPath ? normalizePath(page.thumbnailPath) : null,
    }))
  );
};

export const indexComics = async (
  basePath: string,
  pattern: string,
  onProgress?: (progress: IndexingProgress) => void
): Promise<Set<string>> => {
  console.info(`[Indexing] Starting index for base path: ${normalizePath(basePath)} (pattern: ${pattern})`);
  const normalizedBasePath = normalizePath(basePath);
  const unlistenRustProgress = await listenToRustIndexingProgress((event) => {
    if (normalizePath(event.basePath) !== normalizedBasePath) {
      return;
    }

    onProgress?.({
      current: event.currentComic,
      total: event.totalComics,
      currentPath: normalizePath(event.currentPath),
      percentage: event.percentage,
      currentTask: event.currentTask,
      errors: [],
    });
  });

  let rustPayload;
  try {
    rustPayload = await buildIndexPayloadForPath(basePath, pattern);
  } finally {
    await unlistenRustProgress();
  }

  const errors: IndexingError[] = [...rustPayload.errors];
  const activeComicPaths = new Set<string>();

  const total = rustPayload.comics.length;
  console.info(`[Indexing] Found ${total} candidate comics in ${normalizePath(basePath)}`);

  for (let i = 0; i < total; i++) {
    const comic = rustPayload.comics[i];
    const comicPath = normalizePath(comic.path);
    console.info(`[Indexing] [${i + 1}/${total}] Processing ${comicPath} (type: ${comic.sourceType})`);

    onProgress?.({
      current: i + 1,
      total,
      currentPath: comicPath,
      percentage: total === 0 ? 0 : ((i + 1) / total) * 100,
      currentTask: 'Persisting comic to database',
      errors: [...errors],
    });

    try {
      if (comic.pages.length === 0) {
        console.warn(`[Indexing] [${i + 1}/${total}] Skipping ${comicPath} (no pages found)`);
        continue;
      }
      console.info(`[Indexing] [${i + 1}/${total}] Found ${comic.pages.length} pages for ${comicPath}`);

      console.info(`[Indexing] [${i + 1}/${total}] Upserting comic record for ${comicPath}`);
      const comicId = await comicService.upsertComic({
        path: comicPath,
        source_type: comic.sourceType,
        title: comic.title,
        artist: comic.artist,
        series: comic.series,
        issue: comic.issue,
        cover_image_path: comic.coverImagePath ? normalizePath(comic.coverImagePath) : null,
        page_count: comic.pageCount,
      });
      console.info(`[Indexing] [${i + 1}/${total}] Comic upserted with id ${comicId} for ${comicPath}`);

      const existingPages = await pageService.getPagesByComicId(comicId);
      const existingThumbnailByPageNumber = new Map<number, string>();
      existingPages.forEach((page) => {
        if (page.thumbnail_path) {
          existingThumbnailByPageNumber.set(page.page_number, page.thumbnail_path);
        }
      });

      const thumbnailByPageNumber = await generatePdfFallbackThumbnails(
        comic.pages,
        comicId,
        existingThumbnailByPageNumber,
        (current, totalPages) => {
          onProgress?.({
            current: i + 1,
            total,
            currentPath: comicPath,
            percentage: total === 0 ? 0 : ((i + 1) / total) * 100,
            currentTask: `Generating PDF thumbnails (${current}/${totalPages})`,
            errors: [...errors],
          });
        }
      );

      if (thumbnailByPageNumber.size > 0) {
        comic.pages = comic.pages.map((page) => {
          const fallbackThumb = thumbnailByPageNumber.get(page.pageNumber);
          if (!fallbackThumb) {
            return page;
          }
          return {
            ...page,
            thumbnailPath: fallbackThumb,
          };
        });
      }

      console.info(`[Indexing] [${i + 1}/${total}] Writing page records to database for comic id ${comicId}`);
      await insertIndexedComic(comic, comicId);
      console.info(`[Indexing] [${i + 1}/${total}] Completed ${comicPath}`);

      activeComicPaths.add(comicPath);
    } catch (err) {
      console.error(`[Indexing] [${i + 1}/${total}] Failed ${comicPath}`, err);
      errors.push({
        path: comicPath,
        message: err instanceof Error ? err.message : String(err),
      });
      onProgress?.({
        current: i + 1,
        total,
        currentPath: comicPath,
        percentage: total === 0 ? 0 : ((i + 1) / total) * 100,
        currentTask: 'Failed processing comic',
        errors: [...errors],
      });
    }
  }

  console.info('[Indexing] Running stale comic cleanup for current base path');
  const allDbComics = await comicService.getAllComics();
  for (const dbComic of allDbComics) {
    if (isSubPath(basePath, dbComic.path) && !activeComicPaths.has(dbComic.path)) {
      console.info(`[Indexing] Removing stale comic ${dbComic.path} (id: ${dbComic.id})`);
      await comicService.deleteComic(dbComic.id);
    }
  }

  console.info(
    `[Indexing] Finished base path ${normalizePath(basePath)}. Indexed ${activeComicPaths.size}/${total} comics. Errors: ${errors.length}`
  );

  return activeComicPaths;
};

export const reindexAll = async (
  onProgress?: (progress: GlobalIndexingProgress) => void
): Promise<void> => {
  const paths = await getAllIndexPaths();
  const totalPaths = paths.length;
  const allErrors: IndexingError[] = [];
  const activeComicPaths = new Set<string>();

  if (totalPaths === 0) return;

  for (let i = 0; i < totalPaths; i++) {
    const path = paths[i];
    onProgress?.({
      status: 'scanning',
      currentPathIndex: i + 1,
      totalPaths,
      currentPath: path.path,
      errors: [...allErrors],
    });

    const indexedPaths = await indexComics(path.path, path.pattern, (progress) => {
      const newErrors = progress.errors.filter((error) => !allErrors.some((known) => known.path === error.path));
      if (newErrors.length > 0) {
        allErrors.push(...newErrors);
      }

      onProgress?.({
        ...progress,
        status: 'indexing',
        currentPathIndex: i + 1,
        totalPaths,
        errors: [...allErrors],
      });
    });

    indexedPaths.forEach((indexedPath) => {
      activeComicPaths.add(indexedPath);
    });
  }

  const allDbComics = await comicService.getAllComics();
  for (const dbComic of allDbComics) {
    const belongsToAnyPath = paths.some((path) => isSubPath(path.path, dbComic.path));
    if (!belongsToAnyPath) {
      await comicService.deleteComic(dbComic.id);
    }
  }

  await cleanupIndexedThumbnails(Array.from(activeComicPaths));

  onProgress?.({
    status: 'cleanup',
    currentPathIndex: totalPaths,
    totalPaths,
    errors: [...allErrors],
  });
};

export const reindexPathById = async (
  id: number,
  onProgress?: (progress: IndexingProgress) => void
): Promise<void> => {
  const paths = await getAllIndexPaths();
  const path = paths.find((currentPath) => currentPath.id === id);
  if (!path) throw new Error(`Index path with ID ${id} not found`);

  await indexComics(path.path, path.pattern, onProgress);
};
