import { useRef, useEffect, useCallback } from 'react';

type SlideshowScrollOptions = {
  containerRef: React.RefObject<HTMLDivElement>;
  isActive: boolean;
  delay: number; // total time for scroll + page display
  zoomLevel: number;
  autoScrollEnabled: boolean;
  onScrollComplete: () => void;
};

export const useSlideshowScroll = ({
  containerRef,
  isActive,
  delay,
  zoomLevel,
  autoScrollEnabled,
  onScrollComplete,
}: SlideshowScrollOptions) => {
  const animationRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const startAnimation = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const scrollDistance = scrollHeight - clientHeight;

    if (autoScrollEnabled && scrollDistance > 0) {
      // Linear scroll from top to bottom over the full delay
      const duration = delay;
      const startTime = performance.now();
      container.scrollTop = 0;

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        container.scrollTop = scrollDistance * progress;

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(step);
        } else {
          onScrollComplete?.();
        }
      };

      animationRef.current = requestAnimationFrame(step);
    } else {
      // No scroll needed or disabled, just wait the full delay
      timeoutRef.current = window.setTimeout(onScrollComplete, delay);
    }
  }, [containerRef, delay, autoScrollEnabled, zoomLevel, onScrollComplete]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return () => stopAnimation();
  }, [isActive, startAnimation, stopAnimation]);
};
