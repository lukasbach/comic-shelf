import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ScrollPageIndicator } from './scroll-page-indicator';

describe('ScrollPageIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should be visible when scrolling', () => {
    const { container } = render(
      <ScrollPageIndicator currentPage={0} totalPages={10} isScrolling={true} />
    );
    const indicator = container.firstChild as HTMLElement;
    expect(indicator.className).toContain('opacity-100');
    expect(screen.getByText('Page 1 / 10')).toBeDefined();
  });

  it('should hide after timeout when not scrolling', () => {
    const { container, rerender } = render(
      <ScrollPageIndicator currentPage={0} totalPages={10} isScrolling={true} />
    );
    const indicator = container.firstChild as HTMLElement;
    
    expect(indicator.className).toContain('opacity-100');

    rerender(<ScrollPageIndicator currentPage={0} totalPages={10} isScrolling={false} />);
    
    // Still visible immediately due to being in DOM and effect not having cleared it yet (or timer not finished)
    expect(indicator.className).toContain('opacity-100');

    // Fast forward 2 seconds
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(indicator.className).toContain('opacity-0');
  });
});
