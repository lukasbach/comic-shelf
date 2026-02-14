import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as comicService from './comic-service';
import * as dbModule from './database';

vi.mock('./database', () => ({
  getDb: vi.fn(),
}));

describe('comic-service', () => {
  const mockDb = {
    select: vi.fn(),
    execute: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (dbModule.getDb as any).mockResolvedValue(mockDb);
  });

  it('getAllComics should call select', async () => {
    const mockComics = [{ id: 1, title: 'Comic 1' }];
    mockDb.select.mockResolvedValue(mockComics);

    const result = await comicService.getAllComics();

    expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM comics ORDER BY title ASC');
    expect(result).toEqual(mockComics);
  });

  it('getComicById should return comic or null', async () => {
    mockDb.select.mockResolvedValue([{ id: 1, title: 'Comic 1' }]);
    const result = await comicService.getComicById(1);
    expect(result).toEqual({ id: 1, title: 'Comic 1' });

    mockDb.select.mockResolvedValue([]);
    const resultNull = await comicService.getComicById(2);
    expect(resultNull).toBeNull();
  });

  it('upsertComic should call execute with correct parameters', async () => {
    mockDb.execute.mockResolvedValue({ lastInsertId: 123 });
    
    const comic = {
      path: '/path/to/comic',
      title: 'New Comic',
      artist: 'Artist',
      series: 'Series',
      issue: '1',
      cover_image_path: '/path/to/cover',
      page_count: 10,
      is_favorite: 0,
      view_count: 0,
    };

    const id = await comicService.upsertComic(comic);

    expect(mockDb.execute).toHaveBeenCalled();
    expect(id).toBe(123);
  });
});
