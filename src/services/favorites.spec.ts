import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as comicService from './comic-service';
import * as pageService from './comic-page-service';
import * as dbModule from './database';

vi.mock('./database', () => ({
  getDb: vi.fn(),
}));

describe('favorites and view counter', () => {
  const mockDb = {
    select: vi.fn(),
    execute: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (dbModule.getDb as any).mockResolvedValue(mockDb);
  });

  describe('comic-service', () => {
    it('toggleFavorite should execute UPDATE', async () => {
      await comicService.toggleFavorite(1);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE comics SET is_favorite = NOT is_favorite, updated_at = datetime('now') WHERE id = $1"),
        [1]
      );
    });

    it('incrementViewCount should execute UPDATE', async () => {
      await comicService.incrementViewCount(1);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE comics SET view_count = view_count + 1 WHERE id = $1'),
        [1]
      );
    });

    it('getFavoriteComics should call select with is_favorite = 1', async () => {
      mockDb.select.mockResolvedValue([]);
      await comicService.getFavoriteComics();
      expect(mockDb.select).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.is_favorite = 1')
      );
    });
  });

  describe('comic-page-service', () => {
    it('togglePageFavorite should execute UPDATE', async () => {
      await pageService.togglePageFavorite(1);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE comic_pages SET is_favorite = NOT is_favorite WHERE id = $1'),
        [1]
      );
    });

    it('incrementPageViewCount should execute UPDATE', async () => {
      await pageService.incrementPageViewCount(1);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE comic_pages SET view_count = view_count + 1 WHERE id = $1'),
        [1]
      );
    });

    it('getFavoritePages should call select with JOIN and is_favorite = 1', async () => {
      mockDb.select.mockResolvedValue([]);
      await pageService.getFavoritePages();
      expect(mockDb.select).toHaveBeenCalledWith(
        expect.stringContaining('JOIN comics c ON p.comic_id = c.id')
      );
      expect(mockDb.select).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.is_favorite = 1')
      );
    });
  });
});
