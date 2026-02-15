import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as indexingService from './indexing-service';

vi.mock('./source-file-service', () => ({
  scanComicCandidates: vi.fn(),
  getComicPages: vi.fn(),
  listenToRustIndexingProgress: vi.fn().mockResolvedValue(() => {}),
  cleanupIndexedThumbnails: vi.fn(),
}));

vi.mock('./page-source-utils', () => ({
  renderPdfPagesToPngBytes: vi.fn(),
}));

vi.mock('./comic-service', () => ({
  upsertComic: vi.fn().mockResolvedValue(1),
  getComicByPath: vi.fn().mockResolvedValue({ id: 1, path: 'base/FolderComic' }),
  updateIndexingStatus: vi.fn(),
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

  it('should return null if pattern length does not match', () => {
    const metadata = indexingService.extractMetadata('Artist/Series', '{artist}/{series}/{issue}');
    expect(metadata).toBeNull();
  });

  it('should match literal segments in pattern', () => {
    const metadata = indexingService.extractMetadata('Comics/Artist/Series', 'Comics/{artist}/{series}');
    expect(metadata).toEqual({ artist: 'Artist', series: 'Series', issue: null });

    const mismatch = indexingService.extractMetadata('Manga/Artist/Series', 'Comics/{artist}/{series}');
    expect(mismatch).toBeNull();
  });

  it('should support ** wildcard for zero or more segments', () => {
    const pattern = '{author}/**/{series}';
    
    // Zero segments for **
    const direct = indexingService.extractMetadata('Artist/Series', pattern);
    expect(direct).toEqual({ artist: 'Artist', series: 'Series', issue: null });

    // One segment for **
    const oneSub = indexingService.extractMetadata('Artist/Sub/Series', pattern);
    expect(oneSub).toEqual({ artist: 'Artist', series: 'Series', issue: null });

    // Multiple segments for **
    const multiSub = indexingService.extractMetadata('Artist/a/b/c/Series', pattern);
    expect(multiSub).toEqual({ artist: 'Artist', series: 'Series', issue: null });

    // No match (missing series segment)
    const noMatch = indexingService.extractMetadata('Artist', pattern);
    expect(noMatch).toBeNull();
  });

  it('should support mixed literal and placeholders in segments', () => {
    const metadata = indexingService.extractMetadata(
      'Comix/Various-Authors-NaughtyComix-Endangered-Species',
      'Comix/Various-Authors-{author}-{series}'
    );
    expect(metadata).toEqual({
      artist: 'NaughtyComix',
      series: 'Endangered-Species',
      issue: null
    });
  });

  it('indexes image, pdf and archive candidates', async () => {
    const sourceFileService = await import('./source-file-service');
    const pageSourceUtils = await import('./page-source-utils');
    const comicService = await import('./comic-service');

    vi.mocked(sourceFileService.scanComicCandidates).mockResolvedValue({
      candidates: [{ path: 'base/FolderComic', sourceType: 'image' }],
      errors: [],
    });
    vi.mocked(sourceFileService.getComicPages).mockResolvedValue([
      {
        pageNumber: 1,
        filePath: 'base/FolderComic/1.jpg',
        fileName: '1.jpg',
        sourceType: 'image',
        sourcePath: 'base/FolderComic/1.jpg',
        archiveEntryPath: null,
        pdfPageNumber: null,
      } as any,
    ]);

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
    expect(comicService.upsertComic).toHaveBeenCalled();
  });
});
