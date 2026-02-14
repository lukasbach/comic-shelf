import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePreloadImages } from './use-preload-images';
import { ComicPage } from '../types/comic';

// Mock resolvePageImageUrl
vi.mock('../services/page-source-utils', () => ({
  resolvePageImageUrl: vi.fn().mockImplementation((page: ComicPage) => Promise.resolve(`asset://${page.file_path}`)),
}));

// Mock Image
class MockImage {
  src = '';
}

describe('usePreloadImages', () => {
  const mockPages: ComicPage[] = [
    { id: 1, comic_id: 1, page_number: 1, file_path: '/path/1.jpg', file_name: '1.jpg', thumbnail_path: null, is_favorite: 0, is_viewed: 0, view_count: 0, last_opened_at: null },
    { id: 2, comic_id: 1, page_number: 2, file_path: '/path/2.jpg', file_name: '2.jpg', thumbnail_path: null, is_favorite: 0, is_viewed: 0, view_count: 0, last_opened_at: null },
    { id: 3, comic_id: 1, page_number: 3, file_path: '/path/3.jpg', file_name: '3.jpg', thumbnail_path: null, is_favorite: 0, is_viewed: 0, view_count: 0, last_opened_at: null },
    { id: 4, comic_id: 1, page_number: 4, file_path: '/path/4.jpg', file_name: '4.jpg', thumbnail_path: null, is_favorite: 0, is_viewed: 0, view_count: 0, last_opened_at: null },
    { id: 5, comic_id: 1, page_number: 5, file_path: '/path/5.jpg', file_name: '5.jpg', thumbnail_path: null, is_favorite: 0, is_viewed: 0, view_count: 0, last_opened_at: null },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('Image', MockImage);
  });

  it('should not do anything if pages are empty', () => {
    renderHook(() => usePreloadImages([], 0));
    // No crash
  });

  it('should preload next bunch of images', async () => {
    const spy = vi.spyOn(window, 'Image' as any);
    renderHook(() => usePreloadImages(mockPages, 1, 2));
    
    // Should preload page index 0, 2, 3 (currentPage-1, currentPage+1, currentPage+2)
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(3);
    });
  });
});
