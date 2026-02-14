import { useState, useEffect } from 'react';
import { Comic, ComicPage } from '../types/comic';
import * as comicService from '../services/comic-service';
import * as comicPageService from '../services/comic-page-service';

export const useComicData = (comicId: number) => {
  const [comic, setComic] = useState<Comic | null>(null);
  const [pages, setPages] = useState<ComicPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      comicService.getComicById(comicId),
      comicPageService.getPagesByComicId(comicId),
    ])
      .then(([c, p]) => {
        if (isMounted) {
          setComic(c);
          setPages(p);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [comicId]);

  return { comic, pages, loading, error };
};
