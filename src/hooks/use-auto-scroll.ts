import { useRef, useEffect, useCallback } from 'react';

type AutoScrollOptions = {
  containerRef: React.RefObject<HTMLDivElement>;
  isActive: boolean;
  delay: number; // used to compute scroll speed
  totalPages: number;
  autoScrollEnabled: boolean;
  onReachedBottom?: () => void;
};

export const useAutoScroll = ({
  containerRef,
  isActive,
  delay,
  totalPages,
  autoScrollEnabled,
  onReachedBottom,
}: AutoScrollOptions) => {
  const animationRef = useRef<number | null>(null);
  const waitTimerRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const isWaitingRef = useRef<boolean>(false);

  const startAnimation = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const scrollDistance = scrollHeight - clientHeight;

    if (scrollDistance <= 0) return;

    // Handle non-autoscroll (discrete jump mode)
    if (!autoScrollEnabled) {
      const pixelsPerPage = scrollHeight / totalPages;
      
      const jumpToNext = () => {
        if (!isActive || isWaitingRef.current) return;
        
        container.scrollTop += pixelsPerPage;
        
        if (container.scrollTop + clientHeight >= scrollHeight - 10) {
          isWaitingRef.current = true;
          onReachedBottom?.();
          waitTimerRef.current = window.setTimeout(() => {
            container.scrollTop = 0;
            isWaitingRef.current = false;
            jumpToNext();
          }, 1000);
        } else {
          waitTimerRef.current = window.setTimeout(jumpToNext, delay);
        }
      };

      waitTimerRef.current = window.setTimeout(jumpToNext, delay);
      return;
    }

    // pixels per ms = totalDistance / (totalPages * delay)
    const totalTime = totalPages * delay;
    const pixelsPerMs = scrollDistance / totalTime;

    const step = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      if (!isWaitingRef.current) {
        container.scrollTop += pixelsPerMs * deltaTime;

        if (container.scrollTop + clientHeight >= scrollHeight - 1) {
          isWaitingRef.current = true;
          onReachedBottom?.();
          
          // Wait 1 second at bottom, then reset
          waitTimerRef.current = window.setTimeout(() => {
            if (container) {
              container.scrollTop = 0;
              isWaitingRef.current = false;
              lastTimeRef.current = performance.now();
              animationRef.current = requestAnimationFrame(step);
            }
          }, 1000);
          return;
        }
      }

      animationRef.current = requestAnimationFrame(step);
    };

    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(step);
  }, [containerRef, delay, totalPages, onReachedBottom]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
    lastTimeRef.current = 0;
    isWaitingRef.current = false;
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
