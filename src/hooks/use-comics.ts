import { useState, useEffect } from 'react';
import * as comicService from '../services/comic-service';
import type { Comic } from '../types/comic';

export const useComics = () => {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    comicService.getAllComics().then(setComics).finally(() => setLoading(false));
  }, []);

  return { comics, loading };
};
