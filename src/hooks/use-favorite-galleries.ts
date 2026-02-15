import { useState, useEffect } from 'react';
import * as galleryService from '../services/gallery-service';
import type { Gallery } from '../types/gallery';

export const useFavoriteGalleries = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGalleries = () => {
    setLoading(true);
    galleryService.getFavoriteGalleries()
      .then(setGalleries)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGalleries();

    window.addEventListener('favorites-updated', fetchGalleries);
    return () => window.removeEventListener('favorites-updated', fetchGalleries);
  }, []);

  return { galleries, loading, refresh: fetchGalleries };
};
