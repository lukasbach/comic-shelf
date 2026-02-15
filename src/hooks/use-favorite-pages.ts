import { useState, useEffect } from 'react';
import * as pageService from '../services/comic-page-service';
import type { ComicPage } from '../types/comic';

export type FavoritePage = ComicPage & { comic_title: string; comic_path: string };

export const useFavoritePages = () => {
  const [pages, setPages] = useState<FavoritePage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pageService.getFavoritePages().then(setPages).finally(() => setLoading(false));
  }, []);

  return { pages, loading };
};
