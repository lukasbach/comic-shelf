import { useEffect } from 'react';
import { ComicPage } from '../types/comic';
import { getImageUrl } from '../utils/image-utils';

/**
 * Hook to preload adjacent page images for smoother navigation in the viewer.
 * @param pages List of comic pages
 * @param currentPage Current page index
 * @param preloadCount Number of pages to preload ahead
 */
export const usePreloadImages = (pages: ComicPage[], currentPage: number, preloadCount = 3) => {
  useEffect(() => {
    if (!pages || pages.length === 0) return;

    // Determine which pages to preload (adjacent pages)
    const start = Math.max(0, currentPage - 1);
    const end = Math.min(pages.length, currentPage + preloadCount + 1);
    const pagesToPreload = pages.slice(start, end).filter((_, i) => (start + i) !== currentPage);
    
    pagesToPreload.forEach(page => {
      const img = new Image();
      img.src = getImageUrl(page.file_path);
    });
  }, [pages, currentPage, preloadCount]);
};
