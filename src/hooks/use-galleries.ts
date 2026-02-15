import { useState, useEffect, useCallback } from 'react';
import * as galleryService from '../services/gallery-service';
import { Gallery } from '../types/gallery';

export const useGalleries = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await galleryService.getGalleries();
      setGalleries(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch galleries:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { galleries, loading, error, refresh };
};
