import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as indexingService from './indexing-service';

vi.mock('./source-file-service', () => ({
  buildIndexPayloadForPath: vi.fn(),
  listenToRustIndexingProgress: vi.fn().mockResolvedValue(() => {}),
  cleanupIndexedThumbnails: vi.fn(),
}));

vi.mock('./page-source-utils', () => ({
  renderPdfPagesToPngBytes: vi.fn(),
}));

vi.mock('./comic-service', () => ({
  upsertComic: vi.fn().mockResolvedValue(1),
  getAllComics: vi.fn().mockResolvedValue([]),
  deleteComic: vi.fn(),
}));

vi.mock('./comic-page-service', () => ({
  getPagesByComicId: vi.fn().mockResolvedValue([]),
  insertPages: vi.fn(),
}));

vi.mock('./thumbnail-service', () => ({
  generateThumbnailFromBytes: vi.fn().mockResolvedValue('thumb/path.jpg'),
}));

describe('indexing-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true for image extensions', () => {
    expect(indexingService.isImageFile('test.jpg')).toBe(true);
    expect(indexingService.isImageFile('IMAGE.PNG')).toBe(true);
    expect(indexingService.isImageFile('photo.webp')).toBe(true);
  });

  it('should extract variables from pattern', () => {
    expect(indexingService.parsePattern('{artist}/{series}/{issue}')).toEqual(['artist', 'series', 'issue']);
  });

  it('should map relative path to metadata', () => {
    const metadata = indexingService.extractMetadata('Artist/Series/Issue', '{artist}/{series}/{issue}');
    expect(metadata).toEqual({ artist: 'Artist', series: 'Series', issue: 'Issue' });
  });

  it('indexes image, pdf and archive candidates', async () => {
    const sourceFileService = await import('./source-file-service');
    const pageSourceUtils = await import('./page-source-utils');
    const comicService = await import('./comic-service');

    vi.mocked(sourceFileService.buildIndexPayloadForPath).mockResolvedValue({
      comics: [
        {
          path: 'base/FolderComic',
          title: 'FolderComic',
          sourceType: 'image',
          artist: null,
          series: 'FolderComic',
          issue: null,
          coverImagePath: 'base/FolderComic/1.jpg',
          pageCount: 1,
          pages: [
            {
              pageNumber: 1,
              filePath: 'base/FolderComic/1.jpg',
              fileName: '1.jpg',
              sourceType: 'image',
              sourcePath: 'base/FolderComic/1.jpg',
              archiveEntryPath: null,
              pdfPageNumber: null,
              thumbnailPath: 'thumb/folder-1.jpg',
            },
          ],
        },
        {
          path: 'base/Book.pdf',
          title: 'Book',
          sourceType: 'pdf',
          artist: null,
          series: 'Book',
          issue: null,
          coverImagePath: 'base/Book.pdf',
          pageCount: 2,
          pages: [
            {
              pageNumber: 1,
              filePath: 'base/Book.pdf',
              fileName: 'page-1.pdf',
              sourceType: 'pdf',
              sourcePath: 'base/Book.pdf',
              archiveEntryPath: null,
              pdfPageNumber: 1,
              thumbnailPath: null,
            },
            {
              pageNumber: 2,
              filePath: 'base/Book.pdf',
              fileName: 'page-2.pdf',
              sourceType: 'pdf',
              sourcePath: 'base/Book.pdf',
              archiveEntryPath: null,
              pdfPageNumber: 2,
              thumbnailPath: null,
            },
          ],
        },
        {
          path: 'base/Pack.cbz',
          title: 'Pack',
          sourceType: 'archive',
          artist: null,
          series: 'Pack',
          issue: null,
          coverImagePath: 'base/Pack.cbz',
          pageCount: 1,
          pages: [
            {
              pageNumber: 1,
              filePath: 'base/Pack.cbz',
              fileName: '1.jpg',
              sourceType: 'archive',
              sourcePath: 'base/Pack.cbz',
              archiveEntryPath: '1.jpg',
              pdfPageNumber: null,
              thumbnailPath: 'thumb/pack-1.jpg',
            },
          ],
        },
      ],
      activeComicPaths: ['base/FolderComic', 'base/Book.pdf', 'base/Pack.cbz'],
      errors: [],
    } as any);

    vi.mocked(pageSourceUtils.renderPdfPagesToPngBytes).mockImplementation(
      async (_path, pageNumbers, onPage) => {
        const map = new Map();
        for (const num of pageNumbers) {
          const bytes = new Uint8Array([num]);
          if (onPage) {
            await onPage(num, bytes);
          } else {
            map.set(num, bytes);
          }
        }
        return map;
      }
    );

    const seen = await indexingService.indexComics('base', '{series}');

    expect(seen.has('base/FolderComic')).toBe(true);
    expect(seen.has('base/Book.pdf')).toBe(true);
    expect(seen.has('base/Pack.cbz')).toBe(true);
    expect(comicService.upsertComic).toHaveBeenCalledTimes(3);
    expect(pageSourceUtils.renderPdfPagesToPngBytes).toHaveBeenCalledTimes(1);
  });
});
