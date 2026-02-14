import { useState, useEffect } from 'react';
import * as comicService from '../services/comic-service';
import type { Comic } from '../types/comic';
import { useDebounce } from './use-debounce';

export const useSearchComics = (query: string) => {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setComics([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    comicService.searchComics(debouncedQuery)
      .then(setComics)
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  return { comics, loading };
};
