import { useState, useEffect, useCallback } from 'react';
import * as comicService from '../services/comic-service';
import type { Comic } from '../types/comic';

export const useComics = () => {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    comicService.getAllComics().then(setComics).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();

    let timeout: ReturnType<typeof setTimeout>;
    const handleUpdate = () => {
      clearTimeout(timeout);
      timeout = setTimeout(refresh, 500);
    };

    window.addEventListener('library-updated', handleUpdate);
    window.addEventListener('favorites-updated', refresh);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('library-updated', handleUpdate);
      window.removeEventListener('favorites-updated', refresh);
    };
  }, [refresh]);

  return { comics, loading };
};
