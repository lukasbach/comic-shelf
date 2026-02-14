import type { ComicPage } from '../types/comic';
import { getImageUrl } from '../utils/image-utils';
import { readArchiveImageEntry, readBinaryFile } from './source-file-service';

const resolvedUrlCache = new Map<string, string>();
let pdfWorkerInitialized = false;

const toCacheKey = (page: ComicPage, preferThumbnail: boolean): string => {
  return [
    preferThumbnail ? 'thumb' : 'full',
    page.id,
    page.source_type ?? 'image',
    page.source_path ?? '',
    page.archive_entry_path ?? '',
    page.pdf_page_number ?? '',
    page.file_path,
    page.thumbnail_path ?? '',
  ].join('|');
};

const initPdfWorker = async (): Promise<any> => {
  const pdfjsLib = await import('pdfjs-dist');
  if (!pdfWorkerInitialized) {
    const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerModule.default;
    pdfWorkerInitialized = true;
  }
  return pdfjsLib;
};

const renderPdfPageToBlob = async (pdfPath: string, pageNumber: number, scale: number, mimeType: 'image/jpeg' | 'image/png', quality?: number): Promise<Blob> => {
  const pdfjsLib = await initPdfWorker();
  const bytes = await readBinaryFile(pdfPath);
  const loadingTask = (pdfjsLib as any).getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to create canvas context for PDF page rendering');
  }

  try {
    await page.render({ canvasContext: context, viewport }).promise;
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((nextBlob) => resolve(nextBlob), mimeType, quality);
    });

    if (!blob) {
      throw new Error('Failed to render PDF page to blob');
    }

    return blob;
  } finally {
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;

    try {
      page.cleanup();
    } catch {
      // ignore cleanup errors
    }

    try {
      pdf.cleanup();
    } catch {
      // ignore cleanup errors
    }

    try {
      await pdf.destroy();
    } catch {
      // ignore destroy errors
    }

    try {
      await loadingTask.destroy();
    } catch {
      // ignore destroy errors
    }
  }
};

const renderPdfPage = async (pdfPath: string, pageNumber: number): Promise<string> => {
  const blob = await renderPdfPageToBlob(pdfPath, pageNumber, 1.2, 'image/jpeg', 0.9);
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert PDF blob to data URL'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read PDF blob as data URL'));
    reader.readAsDataURL(blob);
  });
};

export const renderPdfPagesToPngBytes = async (
  pdfPath: string,
  pageNumbers: number[],
  onPage?: (pageNumber: number, bytes: Uint8Array) => Promise<void>
): Promise<Map<number, Uint8Array>> => {
  const output = new Map<number, Uint8Array>();
  if (pageNumbers.length === 0) {
    return output;
  }

  const pdfjsLib = await initPdfWorker();
  const bytes = await readBinaryFile(pdfPath);
  const loadingTask = (pdfjsLib as any).getDocument({ data: bytes });
  const pdf = await loadingTask.promise;

  try {
    for (const pageNumber of pageNumbers) {
      const page = await pdf.getPage(pageNumber);
      
      // Target a maximum dimension of 300px for thumbnails to save memory and IPC bandwidth
      const viewport1 = page.getViewport({ scale: 1.0 });
      const targetDim = 300;
      const scale = Math.min(targetDim / viewport1.width, targetDim / viewport1.height);
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to create canvas context for PDF thumbnail rendering');
      }

      try {
        await page.render({ canvasContext: context, viewport }).promise;
        const blob = await new Promise<Blob | null>((resolve) => {
          // Use image/jpeg for smaller payload size if possible, or stick to png for quality
          canvas.toBlob((nextBlob) => resolve(nextBlob), 'image/jpeg', 0.8);
        });

        if (!blob) {
          throw new Error('Failed to render PDF page to blob');
        }

        const pageBytes = new Uint8Array(await blob.arrayBuffer());
        if (onPage) {
          try {
            await onPage(pageNumber, pageBytes);
          } catch (err) {
            console.error(`[PageSourceUtils] onPage callback failed for page ${pageNumber}`, err);
          }
        } else {
          output.set(pageNumber, pageBytes);
        }
      } finally {
        context.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
        try {
          page.cleanup();
        } catch {
          // ignore cleanup errors
        }
      }
    }

    return output;
  } finally {
    try {
      pdf.cleanup();
    } catch {
      // ignore cleanup errors
    }

    try {
      await pdf.destroy();
    } catch {
      // ignore destroy errors
    }

    try {
      await loadingTask.destroy();
    } catch {
      // ignore destroy errors
    }
  }
};

export const resolvePageImageUrl = async (page: ComicPage, preferThumbnail = false): Promise<string> => {
  if (preferThumbnail && page.thumbnail_path) {
    return getImageUrl(page.thumbnail_path);
  }

  const cacheKey = toCacheKey(page, preferThumbnail);
  const cached = resolvedUrlCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const sourceType = page.source_type ?? 'image';
  if (sourceType === 'image') {
    const directUrl = getImageUrl(page.file_path);
    resolvedUrlCache.set(cacheKey, directUrl);
    return directUrl;
  }

  if (sourceType === 'pdf') {
    const pageNumber = page.pdf_page_number ?? page.page_number;
    const sourcePath = page.source_path ?? page.file_path;
    const rendered = await renderPdfPage(sourcePath, pageNumber);
    resolvedUrlCache.set(cacheKey, rendered);
    return rendered;
  }

  const sourcePath = page.source_path ?? page.file_path;
  const entryPath = page.archive_entry_path;
  if (!entryPath) {
    const fallbackUrl = getImageUrl(page.file_path);
    resolvedUrlCache.set(cacheKey, fallbackUrl);
    return fallbackUrl;
  }

  const bytes = await readArchiveImageEntry(sourcePath, entryPath);
  const archiveUrl = URL.createObjectURL(new Blob([bytes]));

  resolvedUrlCache.set(cacheKey, archiveUrl);
  return archiveUrl;
};

export const resolvePagePreviewUrl = async (page: ComicPage): Promise<string> => {
  return await resolvePageImageUrl(page, true);
};

export const decodeImageBytesForThumbnail = async (page: ComicPage): Promise<Uint8Array | null> => {
  const sourceType = page.source_type ?? 'image';
  if (sourceType === 'image') {
    return null;
  }

  if (sourceType === 'pdf') {
    const pageNumber = page.pdf_page_number ?? page.page_number;
    const sourcePath = page.source_path ?? page.file_path;
    const blob = await renderPdfPageToBlob(sourcePath, pageNumber, 1.0, 'image/png');
    return new Uint8Array(await blob.arrayBuffer());
  }

  const sourcePath = page.source_path ?? page.file_path;
  const entryPath = page.archive_entry_path;
  if (!entryPath) {
    return null;
  }

  return await readArchiveImageEntry(sourcePath, entryPath);
};
