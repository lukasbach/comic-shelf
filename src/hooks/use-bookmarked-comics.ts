import { useState, useEffect } from 'react';
import { getBookmarkedComics } from '../services/comic-service';
import type { Comic } from '../types/comic';

export const useBookmarkedComics = () => {
  const [comics, setComics] = useState<Comic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComics = async () => {
    try {
      const data = await getBookmarkedComics();
      setComics(data);
    } catch (error) {
      console.error('Failed to fetch bookmarked comics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComics();
    window.addEventListener('favorites-updated', fetchComics);
    return () => window.removeEventListener('favorites-updated', fetchComics);
  }, []);

  return { comics, isLoading };
};
