import { useState, useCallback, useEffect, useRef } from 'react';

type SlideshowOptions = {
  delay: number;
  onAdvance?: () => void;
  enabled?: boolean;
  useInternalTimer?: boolean;
};

type UseSlideshowReturn = {
  isActive: boolean;
  isPaused: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  pause: () => void;
  resume: () => void;
  progress: number;
};

export const useSlideshow = ({
  delay,
  onAdvance,
  enabled = true,
  useInternalTimer = true,
}: SlideshowOptions): UseSlideshowReturn => {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const timerRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const remainingTimeRef = useRef<number>(delay);

  const startTimer = useCallback((duration: number) => {
    if (!useInternalTimer || !onAdvance) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (progressTimerRef.current) window.cancelAnimationFrame(progressTimerRef.current);

    startTimeRef.current = performance.now();
    remainingTimeRef.current = duration;

    timerRef.current = window.setTimeout(() => {
      onAdvance();
      startTimer(delay); // Restart for next page
    }, duration);

    const updateProgress = () => {
      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      
      const totalElapsed = (delay - duration) + elapsed;
      setProgress(Math.min(totalElapsed / delay, 1));

      if (elapsed < duration) {
        progressTimerRef.current = window.requestAnimationFrame(updateProgress);
      }
    };

    progressTimerRef.current = window.requestAnimationFrame(updateProgress);
  }, [delay, onAdvance, useInternalTimer]);

  const stop = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setProgress(0);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (progressTimerRef.current) window.cancelAnimationFrame(progressTimerRef.current);
    timerRef.current = null;
    progressTimerRef.current = null;
  }, []);

  const start = useCallback(() => {
    if (!enabled) return;
    setIsActive(true);
    setIsPaused(false);
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

  const pause = useCallback(() => {
    if (!isActive || isPaused) return;
    
    setIsPaused(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (progressTimerRef.current) window.cancelAnimationFrame(progressTimerRef.current);
    
    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    remainingTimeRef.current -= elapsed;
  }, [isActive, isPaused]);

  const resume = useCallback(() => {
    if (!isActive || !isPaused) return;
    
    setIsPaused(false);
    if (useInternalTimer && onAdvance) {
      startTimer(remainingTimeRef.current);
    }
  }, [isActive, isPaused, startTimer, useInternalTimer, onAdvance]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (progressTimerRef.current) window.cancelAnimationFrame(progressTimerRef.current);
    };
  }, []);

  return {
    isActive,
    isPaused,
    start,
    stop,
    toggle,
    pause,
    resume,
    progress,
  };
};
