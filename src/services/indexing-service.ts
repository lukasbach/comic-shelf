import * as comicService from './comic-service';
import * as pageService from './comic-page-service';
import * as thumbnailService from './thumbnail-service';
import {
  countPdfPages,
  listArchiveImageEntries,
  listImagePages,
  readArchiveImageEntriesBatch,
  scanComicCandidates,
} from './source-file-service';
import { renderPdfPagesToPngBytes } from './page-source-utils';
import { isSubPath, normalizePath } from '../utils/image-utils';
import type { ComicPage } from '../types/comic';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

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

export const isImageFile = (fileName: string): boolean => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return !!ext && IMAGE_EXTENSIONS.includes(ext);
};

export const parsePattern = (pattern: string): string[] => {
  const matches = pattern.match(/\{([^}]+)\}/g);
  return matches ? matches.map((m) => m.slice(1, -1)) : [];
};

export const extractMetadata = (relativePath: string, pattern: string): Record<string, string | null> => {
  const patternVars = parsePattern(pattern);
  const patternSegments = pattern.split(/[\\/]/);
  const pathSegments = normalizePath(relativePath).split('/');

  const metadata: Record<string, string | null> = {};
  patternVars.forEach((v) => {
    metadata[v] = null;
  });

  patternSegments.forEach((segment, index) => {
    const varMatch = segment.match(/^\{([^}]+)\}$/);
    if (varMatch && pathSegments[index]) {
      metadata[varMatch[1]] = pathSegments[index];
    }
  });

  return metadata;
};

const buildImagePages = async (comicPath: string): Promise<ComicPage[]> => {
  const entries = await listImagePages(comicPath);
  return entries.map((entry) => ({
    id: 0,
    comic_id: 0,
    page_number: entry.pageNumber,
    file_path: normalizePath(entry.filePath),
    file_name: entry.fileName,
    source_type: 'image',
    source_path: normalizePath(entry.filePath),
    archive_entry_path: null,
    pdf_page_number: null,
    thumbnail_path: null,
    is_favorite: 0,
    is_viewed: 0,
    view_count: 0,
    last_opened_at: null,
  }));
};

const buildPdfPages = async (comicPath: string): Promise<ComicPage[]> => {
  const count = await countPdfPages(comicPath);
  return Array.from({ length: count }).map((_, index) => ({
    id: 0,
    comic_id: 0,
    page_number: index + 1,
    file_path: normalizePath(comicPath),
    file_name: `page-${index + 1}.pdf`,
    source_type: 'pdf',
    source_path: normalizePath(comicPath),
    archive_entry_path: null,
    pdf_page_number: index + 1,
    thumbnail_path: null,
    is_favorite: 0,
    is_viewed: 0,
    view_count: 0,
    last_opened_at: null,
  }));
};

const buildArchivePages = async (comicPath: string): Promise<ComicPage[]> => {
  const entries = await listArchiveImageEntries(comicPath);
  return entries.map((entryPath, index) => {
    const fileName = entryPath.split('/').pop() ?? entryPath;
    return {
      id: 0,
      comic_id: 0,
      page_number: index + 1,
      file_path: normalizePath(comicPath),
      file_name: fileName,
      source_type: 'archive',
      source_path: normalizePath(comicPath),
      archive_entry_path: entryPath,
      pdf_page_number: null,
      thumbnail_path: null,
      is_favorite: 0,
      is_viewed: 0,
      view_count: 0,
      last_opened_at: null,
    } satisfies ComicPage;
  });
};

const buildPagesForComic = async (comicPath: string, sourceType: 'image' | 'pdf' | 'archive'): Promise<ComicPage[]> => {
  if (sourceType === 'image') {
    return await buildImagePages(comicPath);
  }
  if (sourceType === 'pdf') {
    return await buildPdfPages(comicPath);
  }
  return await buildArchivePages(comicPath);
};

const generateThumbnailsForComicPages = async (
  pages: ComicPage[],
  comicId: number,
  existingThumbnailByPageNumber: Map<number, string>
): Promise<Map<number, string | null>> => {
  const output = new Map<number, string | null>();
  if (pages.length === 0) {
    return output;
  }

  pages.forEach((page) => {
    const existingThumb = existingThumbnailByPageNumber.get(page.page_number);
    if (existingThumb) {
      output.set(page.page_number, normalizePath(existingThumb));
      console.info(`[Indexing] [Thumbnail] Reusing existing thumbnail for comic ${comicId}, page ${page.page_number}`);
    }
  });

  const pagesToGenerate = pages.filter((page) => !output.has(page.page_number));
  if (pagesToGenerate.length === 0) {
    return output;
  }

  const sourceType = pagesToGenerate[0].source_type ?? 'image';

  if (sourceType === 'image') {
    for (const page of pagesToGenerate) {
      console.info(`[Indexing] [Thumbnail] Creating image thumbnail for comic ${comicId}, page ${page.page_number}`);
      const thumb = await thumbnailService.generateThumbnail(page.file_path, comicId, page.page_number);
      output.set(page.page_number, normalizePath(thumb));
      console.info(`[Indexing] [Thumbnail] Created image thumbnail for comic ${comicId}, page ${page.page_number}`);
    }
    return output;
  }

  if (sourceType === 'pdf') {
    const sourcePath = pagesToGenerate[0].source_path ?? pagesToGenerate[0].file_path;
    const pageNumbers = pagesToGenerate.map((page) => page.pdf_page_number ?? page.page_number);
    const pngBytesByPageNumber = await renderPdfPagesToPngBytes(sourcePath, pageNumbers);

    for (const page of pagesToGenerate) {
      const key = page.pdf_page_number ?? page.page_number;
      const bytes = pngBytesByPageNumber.get(key);
      if (!bytes) {
        console.warn(`[Indexing] [Thumbnail] Missing rendered PDF bytes for comic ${comicId}, page ${page.page_number}`);
        output.set(page.page_number, null);
        continue;
      }
      console.info(`[Indexing] [Thumbnail] Creating PDF thumbnail for comic ${comicId}, page ${page.page_number}`);
      const thumb = await thumbnailService.generateThumbnailFromBytes(bytes, comicId, page.page_number);
      output.set(page.page_number, normalizePath(thumb));
    }
    return output;
  }

  const sourcePath = pagesToGenerate[0].source_path ?? pagesToGenerate[0].file_path;
  const entryPaths = pagesToGenerate
    .map((page) => page.archive_entry_path)
    .filter((entryPath): entryPath is string => Boolean(entryPath));

  const bytesBatch = await readArchiveImageEntriesBatch(sourcePath, entryPaths);
  const bytesByEntry = new Map<string, Uint8Array>();
  entryPaths.forEach((entryPath, index) => {
    bytesByEntry.set(entryPath, bytesBatch[index]);
  });

  for (const page of pagesToGenerate) {
    const entryPath = page.archive_entry_path;
    if (!entryPath) {
      console.warn(`[Indexing] [Thumbnail] Missing archive entry path for comic ${comicId}, page ${page.page_number}`);
      output.set(page.page_number, null);
      continue;
    }
    const bytes = bytesByEntry.get(entryPath);
    if (!bytes) {
      console.warn(`[Indexing] [Thumbnail] Missing archive bytes for comic ${comicId}, page ${page.page_number} (${entryPath})`);
      output.set(page.page_number, null);
      continue;
    }

    console.info(`[Indexing] [Thumbnail] Creating archive thumbnail for comic ${comicId}, page ${page.page_number} (${entryPath})`);
    const thumb = await thumbnailService.generateThumbnailFromBytes(bytes, comicId, page.page_number);
    output.set(page.page_number, normalizePath(thumb));
    console.info(`[Indexing] [Thumbnail] Created archive thumbnail for comic ${comicId}, page ${page.page_number} (${entryPath})`);
  }

  return output;
};

export const indexComics = async (
  basePath: string,
  pattern: string,
  onProgress?: (progress: IndexingProgress) => void
): Promise<Set<string>> => {
  console.info(`[Indexing] Starting index for base path: ${normalizePath(basePath)} (pattern: ${pattern})`);
  const errors: IndexingError[] = [];
  const activeComicPaths = new Set<string>();

  const candidates = await scanComicCandidates(basePath);
  const total = candidates.length;
  console.info(`[Indexing] Found ${total} candidate comics in ${normalizePath(basePath)}`);

  for (let i = 0; i < total; i++) {
    const candidate = candidates[i];
    const comicPath = normalizePath(candidate.path);
    console.info(`[Indexing] [${i + 1}/${total}] Processing ${comicPath} (type: ${candidate.sourceType})`);

    onProgress?.({
      current: i + 1,
      total,
      currentPath: comicPath,
      errors: [...errors],
    });

    try {
      console.info(`[Indexing] [${i + 1}/${total}] Extracting metadata and pages for ${comicPath}`);
      const relPath = getRelativePath(basePath, comicPath);
      const metadata = extractMetadata(relPath, pattern);
      const pages = await buildPagesForComic(comicPath, candidate.sourceType);
      if (pages.length === 0) {
        console.warn(`[Indexing] [${i + 1}/${total}] Skipping ${comicPath} (no pages found)`);
        continue;
      }
      console.info(`[Indexing] [${i + 1}/${total}] Found ${pages.length} pages for ${comicPath}`);

      console.info(`[Indexing] [${i + 1}/${total}] Upserting comic record for ${comicPath}`);
      const comicId = await comicService.upsertComic({
        path: comicPath,
        source_type: candidate.sourceType,
        title: candidate.title,
        artist: metadata.artist || null,
        series: metadata.series || null,
        issue: metadata.issue || null,
        cover_image_path: pages[0].file_path,
        page_count: pages.length,
        is_favorite: 0,
        view_count: 0,
      });
      console.info(`[Indexing] [${i + 1}/${total}] Comic upserted with id ${comicId} for ${comicPath}`);

      const existingPages = await pageService.getPagesByComicId(comicId);
      const existingThumbnailByPageNumber = new Map<number, string>();
      existingPages.forEach((page) => {
        if (page.thumbnail_path) {
          existingThumbnailByPageNumber.set(page.page_number, page.thumbnail_path);
        }
      });

      console.info(`[Indexing] [${i + 1}/${total}] Generating thumbnails for ${pages.length} pages (${comicPath})`);
      const thumbnailByPageNumber = await generateThumbnailsForComicPages(
        pages,
        comicId,
        existingThumbnailByPageNumber
      );
      const pagesWithThumbs = pages.map((page) => ({
        ...page,
        thumbnail_path: thumbnailByPageNumber.get(page.page_number) ?? null,
      }));

      console.info(`[Indexing] [${i + 1}/${total}] Writing page records to database for comic id ${comicId}`);
      await pageService.insertPages(
        comicId,
        pagesWithThumbs.map((p) => ({
          page_number: p.page_number,
          file_path: p.file_path,
          file_name: p.file_name,
          source_type: p.source_type,
          source_path: p.source_path,
          archive_entry_path: p.archive_entry_path,
          pdf_page_number: p.pdf_page_number,
          thumbnail_path: p.thumbnail_path,
        }))
      );
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
      await thumbnailService.deleteThumbnailsForComic(dbComic.id);
    }
  }

  console.info('[Indexing] Running orphan thumbnail cleanup');
  const remainingComics = await comicService.getAllComics();
  await thumbnailService.cleanupOrphans(remainingComics.map((c) => c.id));

  console.info(
    `[Indexing] Finished base path ${normalizePath(basePath)}. Indexed ${activeComicPaths.size}/${total} comics. Errors: ${errors.length}`
  );

  return activeComicPaths;
};
