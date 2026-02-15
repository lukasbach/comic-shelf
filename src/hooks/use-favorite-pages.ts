import { useState, useEffect } from 'react';
import * as pageService from '../services/comic-page-service';
import type { ComicPage } from '../types/comic';

export type FavoritePage = ComicPage & { comic_title: string; comic_path: string };

export const useFavoritePages = () => {
  const [pages, setPages] = useState<FavoritePage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = () => {
    setLoading(true);
    pageService.getFavoritePages().then(setPages).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPages();
  }, []);

  return { pages, loading, refresh: fetchPages };
};
