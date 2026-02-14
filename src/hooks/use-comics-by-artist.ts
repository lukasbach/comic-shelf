import { useState, useEffect } from 'react';
import * as comicService from '../services/comic-service';
import type { Comic } from '../types/comic';

export type ArtistGroup = {
  artist: string;
  comics: Comic[];
};

export const useComicsByArtist = () => {
  const [groups, setGroups] = useState<ArtistGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    comicService.getAllComics().then((allComics) => {
      const grouped = allComics.reduce((acc, comic) => {
        const artist = comic.artist || 'Unknown Artist';
        if (!acc[artist]) {
          acc[artist] = [];
        }
        acc[artist].push(comic);
        return acc;
      }, {} as Record<string, Comic[]>);

      const result = Object.entries(grouped)
        .map(([artist, comics]) => ({ artist, comics }))
        .sort((a, b) => a.artist.localeCompare(b.artist));

      setGroups(result);
    }).finally(() => setLoading(false));
  }, []);

  return { groups, loading };
};
