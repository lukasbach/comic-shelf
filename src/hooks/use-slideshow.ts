import { useState, useCallback, useEffect, useRef } from 'react';

type SlideshowOptions = {
  delay: number;
  onAdvance?: () => void;
  enabled?: boolean;
  useInternalTimer?: boolean;
};

type UseSlideshowReturn = {
  isActive: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  progress: number;
};

export const useSlideshow = ({
  delay,
  onAdvance,
  enabled = true,
  useInternalTimer = true,
}: SlideshowOptions): UseSlideshowReturn => {
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const timerRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startTimer = useCallback((duration: number) => {
    if (!useInternalTimer || !onAdvance) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (progressTimerRef.current) window.cancelAnimationFrame(progressTimerRef.current);

    startTimeRef.current = performance.now();

    timerRef.current = window.setTimeout(() => {
      onAdvance();
      startTimer(delay); // Restart for next page
    }, duration);

    const updateProgress = () => {
      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      
      setProgress(Math.min(elapsed / delay, 1));

      if (elapsed < duration) {
        progressTimerRef.current = window.requestAnimationFrame(updateProgress);
      }
    };

    progressTimerRef.current = window.requestAnimationFrame(updateProgress);
  }, [delay, onAdvance, useInternalTimer]);

  const stop = useCallback(() => {
    setIsActive(false);
    setProgress(0);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (progressTimerRef.current) window.cancelAnimationFrame(progressTimerRef.current);
    timerRef.current = null;
    progressTimerRef.current = null;
  }, []);

  const start = useCallback(() => {
    if (!enabled) return;
    setIsActive(true);
    setProgress(0);
    if (useInternalTimer && onAdvance) {
      startTimer(delay);
    }
  }, [enabled, delay, startTimer, useInternalTimer, onAdvance]);

  const toggle = useCallback(() => {
    if (isActive) {
      stop();
    } else {
      start();
    }
  }, [isActive, start, stop]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (progressTimerRef.current) window.cancelAnimationFrame(progressTimerRef.current);
    };
  }, []);

  return {
    isActive,
    start,
    stop,
    toggle,
    progress,
  };
};
