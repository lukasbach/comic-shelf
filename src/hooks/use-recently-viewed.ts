import { useState, useEffect, useCallback } from 'react';
import * as comicService from '../services/comic-service';
import * as pageService from '../services/comic-page-service';
import type { Comic, ComicPage } from '../types/comic';

export type RecentlyViewedPage = ComicPage & { comic_title: string; comic_path: string };

export const useRecentlyViewed = (limit: number = 6) => {
  const [comics, setComics] = useState<Comic[]>([]);
  const [pages, setPages] = useState<RecentlyViewedPage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentlyViewed = useCallback(async () => {
    try {
      const [recentComics, recentPages] = await Promise.all([
        comicService.getRecentlyViewedComics(limit),
        pageService.getRecentlyViewedPages(limit),
      ]);
      setComics(recentComics);
      setPages(recentPages);
    } catch (error) {
      console.error('Failed to fetch recently viewed items:', error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchRecentlyViewed();

    // Listen for updates to refresh the list
    const handleUpdate = () => fetchRecentlyViewed();
    window.addEventListener('favorites-updated', handleUpdate);
    window.addEventListener('comic-opened', handleUpdate);

    return () => {
      window.removeEventListener('favorites-updated', handleUpdate);
      window.removeEventListener('comic-opened', handleUpdate);
    };
  }, [fetchRecentlyViewed]);

  return { comics, pages, loading, refetch: fetchRecentlyViewed };
};
