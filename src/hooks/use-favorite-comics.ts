import { useState, useEffect } from 'react';
import * as comicService from '../services/comic-service';
import type { Comic } from '../types/comic';

export const useFavoriteComics = () => {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComics = () => {
    setLoading(true);
    comicService.getFavoriteComics()
      .then(setComics)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComics();

    window.addEventListener('favorites-updated', fetchComics);
    return () => window.removeEventListener('favorites-updated', fetchComics);
  }, []);

  return { comics, loading, refetch: fetchComics };
};
