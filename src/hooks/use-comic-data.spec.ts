import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useComicData } from './use-comic-data';
import * as comicService from '../services/comic-service';
import * as comicPageService from '../services/comic-page-service';

vi.mock('../services/comic-service', () => ({
  getComicById: vi.fn(),
}));

vi.mock('../services/comic-page-service', () => ({
  getPagesByComicId: vi.fn(),
}));

describe('useComicData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load comic and pages successfully', async () => {
    const mockComic = { id: 1, title: 'Test Comic' };
    const mockPages = [
      { id: 101, comic_id: 1, page_number: 1, file_path: 'page1.jpg' },
      { id: 102, comic_id: 1, page_number: 2, file_path: 'page2.jpg' },
    ];

    vi.mocked(comicService.getComicById).mockResolvedValue(mockComic as any);
    vi.mocked(comicPageService.getPagesByComicId).mockResolvedValue(mockPages as any);

    const { result } = renderHook(() => useComicData(1));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.comic).toEqual(mockComic);
    expect(result.current.pages).toEqual(mockPages);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors', async () => {
    const error = new Error('Database error');
    vi.mocked(comicService.getComicById).mockRejectedValue(error);
    vi.mocked(comicPageService.getPagesByComicId).mockResolvedValue([]);

    const { result } = renderHook(() => useComicData(1));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.comic).toBeNull();
  });
});
