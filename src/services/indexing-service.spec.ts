import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as indexingService from './indexing-service';

vi.mock('./source-file-service', () => ({
  scanComicCandidates: vi.fn(),
  listImagePages: vi.fn(),
  listArchiveImageEntries: vi.fn(),
  readArchiveImageEntriesBatch: vi.fn(),
  countPdfPages: vi.fn(),
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
  generateThumbnail: vi.fn().mockResolvedValue('thumb/path.jpg'),
  generateThumbnailFromBytes: vi.fn().mockResolvedValue('thumb/path.jpg'),
  cleanupOrphans: vi.fn(),
  deleteThumbnailsForComic: vi.fn(),
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

    vi.mocked(sourceFileService.scanComicCandidates).mockResolvedValue([
      { path: 'base/FolderComic', title: 'FolderComic', sourceType: 'image' },
      { path: 'base/Book.pdf', title: 'Book', sourceType: 'pdf' },
      { path: 'base/Pack.cbz', title: 'Pack', sourceType: 'archive' },
    ] as any);

    vi.mocked(sourceFileService.listImagePages).mockResolvedValue([
      { filePath: 'base/FolderComic/1.jpg', fileName: '1.jpg', pageNumber: 1 },
    ] as any);

    vi.mocked(sourceFileService.countPdfPages).mockResolvedValue(2);
    vi.mocked(sourceFileService.listArchiveImageEntries).mockResolvedValue(['1.jpg'] as any);
    vi.mocked(sourceFileService.readArchiveImageEntriesBatch).mockResolvedValue([new Uint8Array([1, 2, 3])] as any);
    vi.mocked(pageSourceUtils.renderPdfPagesToPngBytes).mockResolvedValue(
      new Map([
        [1, new Uint8Array([1])],
        [2, new Uint8Array([2])],
      ]) as any
    );

    const seen = await indexingService.indexComics('base', '{series}');

    expect(seen.has('base/FolderComic')).toBe(true);
    expect(seen.has('base/Book.pdf')).toBe(true);
    expect(seen.has('base/Pack.cbz')).toBe(true);
    expect(comicService.upsertComic).toHaveBeenCalledTimes(3);
  });
});
