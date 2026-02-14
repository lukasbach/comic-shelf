import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as indexingService from './indexing-service';
import { readDir } from '@tauri-apps/plugin-fs';

// Mock Tauri APIs
vi.mock('@tauri-apps/plugin-fs', () => ({
  readDir: vi.fn(),
}));

vi.mock('@tauri-apps/api/path', () => ({
  join: vi.fn().mockImplementation((...args) => args.join('/')),
  relative: vi.fn().mockImplementation((from, to) => to.replace(from + '/', '')),
  basename: vi.fn().mockImplementation((p) => p.split('/').pop()),
  sep: '/',
}));

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: vi.fn().mockImplementation((p) => `asset://${p}`),
}));

// Mock other services
vi.mock('./comic-service', () => ({
  upsertComic: vi.fn().mockResolvedValue(1),
  getAllComics: vi.fn().mockResolvedValue([]),
  deleteComic: vi.fn(),
}));

vi.mock('./comic-page-service', () => ({
  insertPages: vi.fn(),
}));

vi.mock('./thumbnail-service', () => ({
  generateThumbnail: vi.fn().mockResolvedValue('thumb/path.jpg'),
  cleanupOrphans: vi.fn(),
  deleteThumbnailsForComic: vi.fn(),
}));

describe('indexing-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isImageFile', () => {
    it('should return true for image extensions', () => {
      expect(indexingService.isImageFile('test.jpg')).toBe(true);
      expect(indexingService.isImageFile('IMAGE.PNG')).toBe(true);
      expect(indexingService.isImageFile('photo.webp')).toBe(true);
    });

    it('should return false for non-image extensions', () => {
      expect(indexingService.isImageFile('text.txt')).toBe(false);
      expect(indexingService.isImageFile('no-ext')).toBe(false);
    });
  });

  describe('parsePattern', () => {
    it('should extract variables from pattern', () => {
      expect(indexingService.parsePattern('{artist}/{series}/{issue}')).toEqual(['artist', 'series', 'issue']);
      expect(indexingService.parsePattern('{artist}')).toEqual(['artist']);
      expect(indexingService.parsePattern('no-vars')).toEqual([]);
    });
  });

  describe('extractMetadata', () => {
    it('should map relative path to pattern variables', () => {
      const pattern = '{artist}/{series}/{issue}';
      const relPath = 'ArtistName/MySeries/Chapter01';
      const metadata = indexingService.extractMetadata(relPath, pattern);
      
      expect(metadata).toEqual({
        artist: 'ArtistName',
        series: 'MySeries',
        issue: 'Chapter01',
      });
    });

    it('should handle partial paths', () => {
      const pattern = '{artist}/{series}/{issue}';
      const relPath = 'ArtistName/MySeries';
      const metadata = indexingService.extractMetadata(relPath, pattern);
      
      expect(metadata).toEqual({
        artist: 'ArtistName',
        series: 'MySeries',
        issue: null,
      });
    });

    it('should ignore segments not in pattern', () => {
      const pattern = '{artist}/{series}';
      const relPath = 'ArtistName/MySeries/Extra/Path';
      const metadata = indexingService.extractMetadata(relPath, pattern);
      
      expect(metadata).toEqual({
        artist: 'ArtistName',
        series: 'MySeries',
      });
    });
  });

  describe('indexComics', () => {
    it('should index comics and handle errors for individual items', async () => {
      (readDir as any).mockImplementation((path: string) => {
        if (path === 'base') {
          return Promise.resolve([
            { name: 'Comic1', isDirectory: true, isFile: false },
            { name: 'BrokenComic', isDirectory: true, isFile: false },
          ]);
        }
        if (path === 'base/Comic1') {
          return Promise.resolve([
            { name: 'page1.jpg', isDirectory: false, isFile: true },
          ]);
        }
        if (path === 'base/BrokenComic') {
          return Promise.reject(new Error('Permission denied'));
        }
        return Promise.resolve([]);
      });

      const progressLogs: any[] = [];
      await indexingService.indexComics('base', '{series}', (p) => {
        progressLogs.push(p);
      });
      
      // Should have reported errors
      const lastProgress = progressLogs[progressLogs.length - 1];
      expect(lastProgress.errors).toHaveLength(1);
      expect(lastProgress.errors[0].path).toContain('BrokenComic');
      expect(lastProgress.errors[0].message).toBe('Permission denied');

      // Comic1 should have been indexed
      const { upsertComic } = await import('./comic-service');
      expect(upsertComic).toHaveBeenCalledWith(expect.objectContaining({
          path: 'base/Comic1'
      }));
    });
  });
});
