import { useState, useEffect, useCallback } from 'react';
import { Comic, ComicPage } from '../types/comic';
import * as comicService from '../services/comic-service';
import * as comicPageService from '../services/comic-page-service';
import * as galleryService from '../services/gallery-service';

export const useComicData = (idOrSlug: string | number) => {
  const [comic, setComic] = useState<Comic | null>(null);
  const [pages, setPages] = useState<ComicPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isGallery, setIsGallery] = useState(false);
  const [galleryId, setGalleryId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const slug = String(idOrSlug);
    if (slug.startsWith('gallery-')) {
      const gId = Number(slug.replace('gallery-', ''));
      setIsGallery(true);
      setGalleryId(gId);

      galleryService.getGalleryById(gId)
        .then(async (g) => {
          if (!g) throw new Error('Gallery not found');
          const p = await galleryService.getGalleryPages(gId);
          if (isMounted) {
            // Map Gallery to a Comic-like structure for the viewer
            setComic({
              id: g.id,
              title: g.name,
              path: `gallery://${g.id}`,
              page_count: g.page_count || 0,
              is_favorite: 0,
              is_viewed: 0,
              view_count: 0,
              artist: null,
              series: null,
              issue: null,
              cover_image_path: p[0]?.thumbnail_path || null,
              created_at: g.created_at,
              updated_at: g.updated_at,
              last_opened_at: null,
              bookmark_page: null,
              indexing_status: 'completed'
            } as Comic);
            setPages(p);
            setError(null);
          }
        })
        .catch(err => {
          if (isMounted) setError(err instanceof Error ? err : new Error(String(err)));
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      const comicId = Number(slug);
      setIsGallery(false);
      setGalleryId(null);

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
    }

    return () => {
      isMounted = false;
    };
  }, [idOrSlug]);

  const removePageFromGallery = useCallback(async (pageId: number) => {
    if (!isGallery || galleryId === null) return;
    try {
      await galleryService.removePageFromGallery(galleryId, pageId);
      setPages(prev => prev.filter(p => p.id !== pageId));
      setComic(prev => prev ? { ...prev, page_count: Math.max(0, prev.page_count - 1) } : null);
    } catch (err) {
      console.error('Failed to remove page from gallery:', err);
    }
  }, [isGallery, galleryId]);


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

  const toggleComicViewed = useCallback(async () => {
    if (!comic) return;
    const oldViewed = comic.is_viewed;
    try {
      setComic(prev => prev ? { ...prev, is_viewed: prev.is_viewed === 1 ? 0 : 1 } : null);
      await comicService.toggleViewed(comic.id);
    } catch (err) {
      console.error('Failed to toggle comic viewed:', err);
      setComic(prev => prev ? { ...prev, is_viewed: oldViewed } : null);
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

  const togglePageViewed = useCallback(async (pageId: number) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;
    
    const oldViewed = pages[pageIndex].is_viewed;
    try {
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, is_viewed: p.is_viewed === 1 ? 0 : 1 } : p));
      await comicPageService.togglePageViewed(pageId);
    } catch (err) {
      console.error('Failed to toggle page viewed:', err);
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, is_viewed: oldViewed } : p));
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

  const setBookmark = useCallback(async (pageNumber: number) => {
    if (!comic) return;
    try {
      setComic(prev => prev ? { ...prev, bookmark_page: pageNumber } : null);
      await comicService.setBookmark(comic.id, pageNumber);
    } catch (err) {
      console.error('Failed to set bookmark:', err);
    }
  }, [comic]);

  const clearBookmark = useCallback(async () => {
    if (!comic) return;
    try {
      setComic(prev => prev ? { ...prev, bookmark_page: null } : null);
      await comicService.clearBookmark(comic.id);
    } catch (err) {
      console.error('Failed to clear bookmark:', err);
    }
  }, [comic]);

  return { 
    comic, 
    pages, 
    loading, 
    error, 
    isGallery,
    galleryId,
    toggleComicFavorite, 
    toggleComicViewed,
    incrementComicViewCount,
    decrementComicViewCount,
    togglePageFavorite,
    togglePageViewed,
    incrementPageViewCount,
    decrementPageViewCount,
    markPageAsOpened,
    setBookmark,
    clearBookmark,
    removePageFromGallery
  };
};
