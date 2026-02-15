import { useState, useEffect, useCallback } from 'react';
import { ComicPage } from '../types/comic';
import * as comicPageService from '../services/comic-page-service';

export type AllPageItem = ComicPage & { 
  comic_title: string; 
  comic_path: string; 
  comic_artist: string | null;
  created_at: string;
};

export const useAllPages = () => {
  const [pages, setPages] = useState<AllPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await comicPageService.getAllPages();
      setPages(data);
    } catch (err) {
      console.error('Failed to fetch all pages:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  return { pages, loading, error, refetch: fetchPages };
};
