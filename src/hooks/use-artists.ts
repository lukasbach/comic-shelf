import { useState, useEffect, useCallback } from 'react';
import * as comicService from '../services/comic-service';
import type { ArtistMetadata } from '../types/comic';

export const useArtists = () => {
  const [artists, setArtists] = useState<ArtistMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    comicService.getArtistsWithMetadata().then((data) => {
      setArtists(data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();

    let timeout: ReturnType<typeof setTimeout>;
    const handleUpdate = () => {
      clearTimeout(timeout);
      timeout = setTimeout(refresh, 1000); // UI for artists can be even slower
    };

    window.addEventListener('library-updated', handleUpdate);
    window.addEventListener('favorites-updated', refresh);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('library-updated', handleUpdate);
      window.removeEventListener('favorites-updated', refresh);
    };
  }, [refresh]);

  return { artists, loading };
};
