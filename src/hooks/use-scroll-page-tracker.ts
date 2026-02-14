import { useEffect, RefObject } from 'react';

/**
 * Hook to track which page is currently in view during scrolling.
 * Uses IntersectionObserver to detect when a page crosses the center of the viewport.
 */
export const useScrollPageTracker = (
  containerRef: RefObject<HTMLDivElement | null>,
  pageRefs: RefObject<(HTMLDivElement | null)[]>,
  onPageChange: (pageNumber: number) => void
) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !pageRefs.current) return;

    const observerOptions = {
      root: container,
      rootMargin: '-10% 0px -10% 0px', // Shrink root to detect pages in the middle
      threshold: [0, 0.01, 0.1, 0.5], 
    };

    const observer = new IntersectionObserver((entries) => {
      // Find the entry that is most visible or closest to the top
      let bestEntry: IntersectionObserverEntry | null = null;
      
      // We want to find the page that is taking up the "main" part of the screen.
      // Usually the one whose top is closest to the top of the container root.
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
            bestEntry = entry;
          }
        }
      });

      if (bestEntry) {
        const index = pageRefs.current!.indexOf(bestEntry.target as HTMLDivElement);
        if (index !== -1) {
          onPageChange(index);
        }
      }
    }, observerOptions);

    pageRefs.current.forEach((pageRef) => {
      if (pageRef) {
        observer.observe(pageRef);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [containerRef, pageRefs, onPageChange]);
};
