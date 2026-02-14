import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollPageTracker } from './use-scroll-page-tracker';
import { RefObject } from 'react';

describe('useScrollPageTracker', () => {
  const mockOnPageChange = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock IntersectionObserver
    const mockObserve = vi.fn();
    const mockDisconnect = vi.fn();
    
    vi.stubGlobal('IntersectionObserver', vi.fn().mockImplementation(function (this: any, _callback: any, options: any) {
      this.observe = mockObserve;
      this.unobserve = vi.fn();
      this.disconnect = mockDisconnect;
      this.root = options?.root;
    }));
  });

  it('should initialize IntersectionObserver with correct refs', () => {
    const containerRef = { current: document.createElement('div') } as RefObject<HTMLDivElement>;
    const page1 = document.createElement('div');
    const page2 = document.createElement('div');
    const pageRefs = { current: [page1, page2] } as RefObject<(HTMLDivElement | null)[]>;

    renderHook(() => useScrollPageTracker(containerRef, pageRefs, mockOnPageChange));

    expect(window.IntersectionObserver).toHaveBeenCalled();
    const [, options] = (window.IntersectionObserver as any).mock.calls[0];
    
    expect(options.root).toBe(containerRef.current);
  });

  it('should disconnect observer on unmount', () => {
    const disconnect = vi.fn();
    vi.stubGlobal('IntersectionObserver', vi.fn().mockImplementation(function(this: any) {
      this.observe = vi.fn();
      this.disconnect = disconnect;
    }));

    const containerRef = { current: document.createElement('div') } as RefObject<HTMLDivElement>;
    const pageRefs = { current: [document.createElement('div')] } as RefObject<(HTMLDivElement | null)[]>;

    const { unmount } = renderHook(() => useScrollPageTracker(containerRef, pageRefs, mockOnPageChange));
    unmount();

    expect(disconnect).toHaveBeenCalled();
  });
});
