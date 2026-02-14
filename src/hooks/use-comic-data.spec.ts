import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useComicData } from './use-comic-data';
import * as comicService from '../services/comic-service';
import * as comicPageService from '../services/comic-page-service';

vi.mock('../services/comic-service', () => ({
  getComicById: vi.fn(),
  toggleFavorite: vi.fn(),
  incrementViewCount: vi.fn(),
  updateComicLastOpened: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/comic-page-service', () => ({
  getPagesByComicId: vi.fn(),
  togglePageFavorite: vi.fn(),
  incrementPageViewCount: vi.fn(),
  updatePageLastOpened: vi.fn().mockResolvedValue(undefined),
}));

describe('useComicData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load comic and pages successfully', async () => {
    const mockComic = { id: 1, title: 'Test Comic', is_favorite: 0, view_count: 5 };
    const mockPages = [
      { id: 101, comic_id: 1, page_number: 1, file_path: 'page1.jpg', is_favorite: 0, view_count: 0 },
      { id: 102, comic_id: 1, page_number: 2, file_path: 'page2.jpg', is_favorite: 0, view_count: 0 },
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

  it('toggleComicFavorite should update local state and call service', async () => {
    const mockComic = { id: 1, title: 'Test Comic', is_favorite: 0, view_count: 5 };
    vi.mocked(comicService.getComicById).mockResolvedValue(mockComic as any);
    vi.mocked(comicPageService.getPagesByComicId).mockResolvedValue([]);

    const { result } = renderHook(() => useComicData(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleComicFavorite();
    });

    expect(result.current.comic?.is_favorite).toBe(1);
    expect(comicService.toggleFavorite).toHaveBeenCalledWith(1);
  });

  it('incrementComicViewCount should update local state and call service', async () => {
    const mockComic = { id: 1, title: 'Test Comic', is_favorite: 0, view_count: 5 };
    vi.mocked(comicService.getComicById).mockResolvedValue(mockComic as any);
    vi.mocked(comicPageService.getPagesByComicId).mockResolvedValue([]);

    const { result } = renderHook(() => useComicData(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.incrementComicViewCount();
    });

    expect(result.current.comic?.view_count).toBe(6);
    expect(comicService.incrementViewCount).toHaveBeenCalledWith(1);
  });

  it('togglePageFavorite should update local state and call service', async () => {
    const mockPages = [{ id: 101, comic_id: 1, page_number: 1, is_favorite: 0, view_count: 0 }];
    vi.mocked(comicService.getComicById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(comicPageService.getPagesByComicId).mockResolvedValue(mockPages as any);

    const { result } = renderHook(() => useComicData(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.togglePageFavorite(101);
    });

    expect(result.current.pages[0].is_favorite).toBe(1);
    expect(comicPageService.togglePageFavorite).toHaveBeenCalledWith(101);
  });

  it('incrementPageViewCount should update local state and call service', async () => {
    const mockPages = [{ id: 101, comic_id: 1, page_number: 1, is_favorite: 0, view_count: 0 }];
    vi.mocked(comicService.getComicById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(comicPageService.getPagesByComicId).mockResolvedValue(mockPages as any);

    const { result } = renderHook(() => useComicData(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.incrementPageViewCount(101);
    });

    expect(result.current.pages[0].view_count).toBe(1);
    expect(comicPageService.incrementPageViewCount).toHaveBeenCalledWith(101);
  });

  it('should call updateComicLastOpened on load', async () => {
    vi.mocked(comicService.getComicById).mockResolvedValue({ id: 1 } as any);
    vi.mocked(comicPageService.getPagesByComicId).mockResolvedValue([]);
    vi.mocked(comicService.updateComicLastOpened).mockResolvedValue(undefined);

    renderHook(() => useComicData(1));
    await waitFor(() => {
      expect(comicService.updateComicLastOpened).toHaveBeenCalledWith(1);
    });
  });

  it('markPageAsOpened should call service', async () => {
    const { result } = renderHook(() => useComicData(1));
    
    await act(async () => {
      await result.current.markPageAsOpened(101);
    });

    expect(comicPageService.updatePageLastOpened).toHaveBeenCalledWith(101);
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
