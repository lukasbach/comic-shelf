import * as comicService from './comic-service';
import * as pageService from './comic-page-service';
import { getAllIndexPaths } from './index-path-service';
import * as sourceFileService from './source-file-service';
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
  pages: sourceFileService.IndexedPagePayload[],
  comicId: number,
  existingThumbnailByPageNumber: Map<number, string>,
  force: boolean = false,
  onProgress?: (current: number, total: number) => void
): Promise<Map<number, string | null>> => {
  const output = new Map<number, string | null>();
  if (pages.length === 0 || pages[0]?.sourceType !== 'pdf') {
    return output;
  }

  if (!force) {
    pages.forEach((page) => {
      const existingThumb = existingThumbnailByPageNumber.get(page.pageNumber);
      if (existingThumb) {
        output.set(page.pageNumber, normalizePath(existingThumb));
      }
    });
  }

  const pagesToGenerate = pages.filter((page) => !output.has(page.pageNumber));
  if (pagesToGenerate.length === 0) {
    return output;
  }

  const sourcePath = normalizePath(pagesToGenerate[0].sourcePath || pagesToGenerate[0].filePath);
  const pageNumbers = pagesToGenerate.map((page) => page.pdfPageNumber ?? page.pageNumber);
  
  // Create a map for fast lookup of pages by their PDF page number
  const pageByPdfPageNumber = new Map<number, sourceFileService.IndexedPagePayload>();
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



export const indexComics = async (
  basePath: string,
  pattern: string,
  mode: 'quick' | 'full' = 'quick',
  onProgress?: (progress: IndexingProgress) => void
): Promise<Set<string>> => {
  console.info(`[Indexing] Starting ${mode} index for base path: ${normalizePath(basePath)} (pattern: ${pattern})`);
  const normalizedBasePath = normalizePath(basePath);
  const fullReindex = mode === 'full';
  
  const unlistenRustProgress = await sourceFileService.listenToRustIndexingProgress((event) => {
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

  try {
    // 1. Scan for candidates
    onProgress?.({
      current: 0,
      total: 0,
      currentPath: normalizedBasePath,
      percentage: 0,
      currentTask: 'Scanning for candidates...',
      errors: [],
    });

    const { candidates, errors: scanErrors } = await sourceFileService.scanComicCandidates(basePath);
    const total = candidates.length;
    console.info(`[Indexing] Found ${total} candidate comics in ${normalizedBasePath}`);

    const activeComicPaths = new Set<string>();
    const errors: IndexingError[] = [...scanErrors];

    // 2. Initial pass: Upsert all as pending if they match pattern
    for (let i = 0; i < total; i++) {
      const candidate = candidates[i];
      const comicPath = normalizePath(candidate.path);
      const relativePath = isSubPath(normalizedBasePath, comicPath) 
        ? comicPath.substring(normalizedBasePath.length).replace(/^[\\/]/, '')
        : comicPath;
      
      let metadata = extractMetadata(relativePath, pattern);
      if (!metadata) {
        metadata = {
          artist: 'Unknown',
          series: candidate.title,
          issue: null,
        };
      }

      onProgress?.({
        current: i + 1,
        total,
        currentPath: comicPath,
        percentage: (i / total) * 50, // First 50% for discovery
        currentTask: 'Discovering comics...',
        errors: [],
      });

      try {
        await comicService.upsertComic({
          path: comicPath,
          source_type: candidate.sourceType,
          title: candidate.title,
          artist: metadata.artist,
          series: metadata.series,
          issue: metadata.issue,
          cover_image_path: null,
          page_count: 0,
          indexing_status: 'pending',
        });
        activeComicPaths.add(comicPath);
      } catch (err) {
        console.error(`[Indexing] Failed initial upsert for ${comicPath}`, err);
      }
    }

    // 3. Second pass: Process each comic
    const activeComicsArray = Array.from(activeComicPaths);
    const toProcessCount = activeComicsArray.length;

    for (let i = 0; i < toProcessCount; i++) {
      const comicPath = activeComicsArray[i];
      const candidate = candidates.find(c => normalizePath(c.path) === comicPath)!;
      
      onProgress?.({
        current: i + 1,
        total: toProcessCount,
        currentPath: comicPath,
        percentage: 50 + (i / toProcessCount) * 50,
        currentTask: 'Processing comic content...',
        errors: [...errors],
      });

      try {
        const currentComic = await comicService.getComicByPath(comicPath);
        if (!currentComic) {
          throw new Error('Comic not found in database during indexing');
        }
        const comicId = currentComic.id;

        const existingPages = await pageService.getPagesByComicId(comicId);
        const allThumbnailsExist = existingPages.length > 0 && existingPages.every(p => p.thumbnail_exists === 1);

        if (!fullReindex && allThumbnailsExist && currentComic.indexing_status === 'completed' && currentComic.thumbnail_path) {
          console.info(`[Indexing] Skipping ${comicPath} (already indexed with thumbnails)`);
          activeComicPaths.add(comicPath);
          continue;
        }

        await comicService.updateIndexingStatus(comicId, 'processing');

        const pages = await sourceFileService.getComicPages(
          basePath,
          toProcessCount,
          i + 1,
          comicPath,
          candidate.sourceType,
          fullReindex
        );

        if (pages.length === 0) {
          console.warn(`[Indexing] Skipping ${comicPath} (no pages found)`);
          await comicService.updateIndexingStatus(comicId, 'failed', 'No pages found');
          continue;
        }

        const existingThumbnailByPageNumber = new Map<number, string>();
        existingPages.forEach((page) => {
          if (page.thumbnail_path) {
            existingThumbnailByPageNumber.set(page.page_number, page.thumbnail_path);
          }
        });

        const thumbnailByPageNumber = await generatePdfFallbackThumbnails(
          pages,
          comicId,
          existingThumbnailByPageNumber,
          fullReindex,
          (current, totalPages) => {
            onProgress?.({
              current: i + 1,
              total: toProcessCount,
              currentPath: comicPath,
              percentage: 50 + (i / toProcessCount) * 50,
              currentTask: `Generating PDF thumbnails (${current}/${totalPages})`,
              errors: [...errors],
            });
          }
        );

        const finalPages = pages.map((page) => {
          const fallbackThumb = thumbnailByPageNumber.get(page.pageNumber);
          if (!fallbackThumb) return page;
          return { ...page, thumbnailPath: fallbackThumb, thumbnailExists: true };
        });

        const coverImagePath = finalPages.find(p => p.pageNumber === 1)?.filePath ?? finalPages[0].filePath;

        // Update comic with full details
        const relativePath = isSubPath(normalizedBasePath, comicPath) 
          ? comicPath.substring(normalizedBasePath.length).replace(/^[\\/]/, '')
          : comicPath;
        let metadata = extractMetadata(relativePath, pattern);
        if (!metadata) {
          metadata = {
            artist: 'Unknown',
            series: candidate.title,
            issue: null,
          };
        }

        await comicService.upsertComic({
          path: comicPath,
          source_type: candidate.sourceType,
          title: candidate.title,
          artist: metadata.artist,
          series: metadata.series,
          issue: metadata.issue,
          cover_image_path: coverImagePath,
          page_count: finalPages.length,
          indexing_status: 'completed',
        });

        await pageService.insertPages(
          comicId,
          finalPages.map((page) => ({
            page_number: page.pageNumber,
            file_path: normalizePath(page.filePath),
            file_name: page.fileName,
            source_type: page.sourceType,
            source_path: normalizePath(page.sourcePath ?? page.filePath),
            archive_entry_path: page.archiveEntryPath,
            pdf_page_number: page.pdfPageNumber,
            thumbnail_path: page.thumbnailPath ? normalizePath(page.thumbnailPath) : null,
            thumbnail_exists: page.thumbnailExists ? 1 : 0,
          }))
        );
        activeComicPaths.add(comicPath);
      } catch (err) {
        console.error(`[Indexing] Failed processing ${comicPath}`, err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push({ path: comicPath, message: errorMsg });
        
        try {
          const currentComic = await comicService.getComicByPath(comicPath);
          if (currentComic) {
            await comicService.updateIndexingStatus(currentComic.id, 'failed', errorMsg);
          }
        } catch (statusErr) {
          console.error(`[Indexing] Failed to update failure status for ${comicPath}`, statusErr);
        }
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
      `[Indexing] Finished base path ${normalizedBasePath}. Indexed ${activeComicPaths.size}/${toProcessCount} comics. Errors: ${errors.length}`
    );

    return activeComicPaths;
  } finally {
    await unlistenRustProgress();
  }
};

export const reindexAll = async (
  mode: 'quick' | 'full' = 'quick',
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

    const indexedPaths = await indexComics(path.path, path.pattern, mode, (progress) => {
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

  await sourceFileService.cleanupIndexedThumbnails(Array.from(activeComicPaths));

  onProgress?.({
    status: 'cleanup',
    currentPathIndex: totalPaths,
    totalPaths,
    errors: [...allErrors],
  });
};

export const reindexPathById = async (
  id: number,
  mode: 'quick' | 'full' = 'quick',
  onProgress?: (progress: IndexingProgress) => void
): Promise<void> => {
  const paths = await getAllIndexPaths();
  const path = paths.find((currentPath) => currentPath.id === id);
  if (!path) throw new Error(`Index path with ID ${id} not found`);

  await indexComics(path.path, path.pattern, mode, onProgress);
};
