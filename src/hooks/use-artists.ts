import { useState, useEffect } from 'react';
import * as comicService from '../services/comic-service';
import type { ArtistMetadata } from '../types/comic';

export const useArtists = () => {
  const [artists, setArtists] = useState<ArtistMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    comicService.getArtistsWithMetadata().then((data) => {
      setArtists(data);
    }).finally(() => setLoading(false));
  }, []);

  return { artists, loading };
};
