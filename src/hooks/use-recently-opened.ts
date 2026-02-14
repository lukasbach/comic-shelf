import { useState, useEffect, useCallback } from 'react';
import * as comicService from '../services/comic-service';
import * as pageService from '../services/comic-page-service';
import type { Comic, ComicPage } from '../types/comic';

export type RecentlyOpenedPage = ComicPage & { comic_title: string };

export const useRecentlyOpened = (limit: number = 6) => {
  const [comics, setComics] = useState<Comic[]>([]);
  const [pages, setPages] = useState<RecentlyOpenedPage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentlyOpened = useCallback(async () => {
    try {
      const [recentComics, recentPages] = await Promise.all([
        comicService.getRecentlyOpenedComics(limit),
        pageService.getRecentlyOpenedPages(limit),
      ]);
      setComics(recentComics);
      setPages(recentPages);
    } catch (error) {
      console.error('Failed to fetch recently opened items:', error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchRecentlyOpened();

    // Listen for updates to refresh the list
    const handleUpdate = () => fetchRecentlyOpened();
    window.addEventListener('favorites-updated', handleUpdate);
    window.addEventListener('comic-opened', handleUpdate);

    return () => {
      window.removeEventListener('favorites-updated', handleUpdate);
      window.removeEventListener('comic-opened', handleUpdate);
    };
  }, [fetchRecentlyOpened]);

  return { comics, pages, loading, refetch: fetchRecentlyOpened };
};
