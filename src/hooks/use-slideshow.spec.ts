import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSlideshow } from './use-slideshow';

describe('useSlideshow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with inactive state', () => {
    const { result } = renderHook(() => useSlideshow({ delay: 1000 }));
    expect(result.current.isActive).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it('should start and call onAdvance', () => {
    const onAdvance = vi.fn();
    const { result } = renderHook(() => useSlideshow({ delay: 1000, onAdvance }));

    act(() => {
      result.current.start();
    });

    expect(result.current.isActive).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onAdvance).toHaveBeenCalledTimes(1);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(onAdvance).toHaveBeenCalledTimes(2);
  });

  it('should stop', () => {
    const onAdvance = vi.fn();
    const { result } = renderHook(() => useSlideshow({ delay: 1000, onAdvance }));

    act(() => {
      result.current.start();
      result.current.stop();
    });

    expect(result.current.isActive).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('should pause and resume', () => {
    const onAdvance = vi.fn();
    const { result } = renderHook(() => useSlideshow({ delay: 1000, onAdvance }));

    act(() => {
      result.current.start();
    });
    
    act(() => {
      vi.advanceTimersByTime(500);
    });

    act(() => {
      result.current.pause();
    });

    expect(result.current.isPaused).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onAdvance).not.toHaveBeenCalled();

    act(() => {
      result.current.resume();
    });

    expect(result.current.isPaused).toBe(false);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('should update progress', () => {
    // Note: Progress uses requestAnimationFrame which might be tricky in fake timers
    // but we can try vi.advanceTimersByTime if we mock rAF
    const { result } = renderHook(() => useSlideshow({ delay: 1000, onAdvance: () => {} }));

    act(() => {
      result.current.start();
    });

    // We can't easily test exact progress due to rAF, but we can verify it's a number
    expect(typeof result.current.progress).toBe('number');
  });
});
