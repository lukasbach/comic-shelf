import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSlideshowScroll } from './use-slideshow-scroll';

describe('useSlideshowScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16));
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should not scroll if inactive', () => {
    const container = { scrollHeight: 2000, clientHeight: 1000, scrollTop: 0 } as any;
    const containerRef = { current: container };
    const onScrollComplete = vi.fn();

    renderHook(() => useSlideshowScroll({
      containerRef,
      isActive: false,
      delay: 1000,
      zoomLevel: 200,
      autoScrollEnabled: true,
      onScrollComplete,
    }));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onScrollComplete).not.toHaveBeenCalled();
    expect(container.scrollTop).toBe(0);
  });

  it('should scroll and call complete if active and zoomed', () => {
    const container = { scrollHeight: 2000, clientHeight: 1000, scrollTop: 0 } as any;
    const containerRef = { current: container };
    const onScrollComplete = vi.fn();

    renderHook(() => useSlideshowScroll({
      containerRef,
      isActive: true,
      delay: 1000,
      zoomLevel: 200,
      autoScrollEnabled: true,
      onScrollComplete,
    }));

    act(() => {
      // Advance through duration (900ms) + 10% wait (100ms)
      vi.advanceTimersByTime(1100);
    });

    expect(onScrollComplete).toHaveBeenCalled();
    expect(container.scrollTop).toBeGreaterThan(0);
  });

  it('should only wait delay if not scrollable', () => {
    const container = { scrollHeight: 1000, clientHeight: 1000, scrollTop: 0 } as any;
    const containerRef = { current: container };
    const onScrollComplete = vi.fn();

    renderHook(() => useSlideshowScroll({
      containerRef,
      isActive: true,
      delay: 1000,
      zoomLevel: 100, // not zoomed
      autoScrollEnabled: true,
      onScrollComplete,
    }));

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onScrollComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onScrollComplete).toHaveBeenCalled();
  });
});
