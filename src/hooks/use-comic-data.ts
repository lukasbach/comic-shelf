import { useState, useEffect, useCallback } from 'react';
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
      comicService.updateComicLastOpened(comicId).catch(err => console.error('Failed to update comic last opened:', err))
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

  const toggleComicFavorite = useCallback(async () => {
    if (!comic) return;
    const oldFavorite = comic.is_favorite;
    try {
      setComic(prev => prev ? { ...prev, is_favorite: prev.is_favorite === 1 ? 0 : 1 } : null);
      await comicService.toggleFavorite(comic.id);
    } catch (err) {
      console.error('Failed to toggle comic favorite:', err);
      setComic(prev => prev ? { ...prev, is_favorite: oldFavorite } : null);
    }
  }, [comic]);

  const incrementComicViewCount = useCallback(async () => {
    if (!comic) return;
    try {
      setComic(prev => prev ? { ...prev, view_count: prev.view_count + 1 } : null);
      await comicService.incrementViewCount(comic.id);
    } catch (err) {
      console.error('Failed to increment comic view count:', err);
      setComic(prev => prev ? { ...prev, view_count: prev.view_count } : null);
    }
  }, [comic]);

  const decrementComicViewCount = useCallback(async () => {
    if (!comic) return;
    try {
      setComic(prev => prev ? { ...prev, view_count: Math.max(0, prev.view_count - 1) } : null);
      await comicService.decrementViewCount(comic.id);
    } catch (err) {
      console.error('Failed to decrement comic view count:', err);
      setComic(prev => prev ? { ...prev, view_count: prev.view_count } : null);
    }
  }, [comic]);

  const togglePageFavorite = useCallback(async (pageId: number) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;
    
    const oldFavorite = pages[pageIndex].is_favorite;
    try {
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, is_favorite: p.is_favorite === 1 ? 0 : 1 } : p));
      await comicPageService.togglePageFavorite(pageId);
    } catch (err) {
      console.error('Failed to toggle page favorite:', err);
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, is_favorite: oldFavorite } : p));
    }
  }, [pages]);

  const incrementPageViewCount = useCallback(async (pageId: number) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;

    try {
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, view_count: p.view_count + 1 } : p));
      await comicPageService.incrementPageViewCount(pageId);
    } catch (err) {
      console.error('Failed to increment page view count:', err);
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, view_count: p.view_count } : p));
    }
  }, [pages]);

  const decrementPageViewCount = useCallback(async (pageId: number) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;

    try {
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, view_count: Math.max(0, p.view_count - 1) } : p));
      await comicPageService.decrementPageViewCount(pageId);
    } catch (err) {
      console.error('Failed to decrement page view count:', err);
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, view_count: p.view_count } : p));
    }
  }, [pages]);

  const markPageAsOpened = useCallback(async (pageId: number) => {
    try {
      await comicPageService.updatePageLastOpened(pageId);
      // We don't necessarily need to update local state since it's not surfaced,
      // but if we were to, we could update the pages array here.
    } catch (err) {
      console.error('Failed to mark page as opened:', err);
    }
  }, []);

  return { 
    comic, 
    pages, 
    loading, 
    error, 
    toggleComicFavorite, 
    incrementComicViewCount,
    decrementComicViewCount,
    togglePageFavorite,
    incrementPageViewCount,
    decrementPageViewCount,
    markPageAsOpened
  };
};
