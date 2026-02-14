import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAutoScroll } from './use-auto-scroll';

describe('useAutoScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should scroll continuously when active', () => {
    const container = { scrollHeight: 5000, clientHeight: 1000, scrollTop: 0 } as any;
    const containerRef = { current: container };

    renderHook(() => useAutoScroll({
      containerRef,
      isActive: true,
      delay: 1000,
      totalPages: 10,
      autoScrollEnabled: true,
    }));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(container.scrollTop).toBeGreaterThan(0);
  });

  it('should reset to top when reaching bottom', () => {
    const container = { scrollHeight: 2000, clientHeight: 1000, scrollTop: 0 } as any;
    const containerRef = { current: container };
    const onReachedBottom = vi.fn();

    renderHook(() => useAutoScroll({
      containerRef,
      isActive: true,
      delay: 500, // short delay
      totalPages: 1,
      autoScrollEnabled: true,
      onReachedBottom,
    }));

    act(() => {
      // Advance enough to reach bottom
      vi.advanceTimersByTime(600);
    });

    expect(onReachedBottom).toHaveBeenCalled();
    
    act(() => {
      // Advance exactly to wait time
      vi.advanceTimersByTime(1000);
    });

    // Should have reset and potentially started scrolling again
    expect(container.scrollTop).toBeLessThan(200); 
  });
});
