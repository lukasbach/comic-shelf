import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LazyPage } from './lazy-page';
import { ComicPage } from '../../types/comic';

// Mock getImageUrl
vi.mock('../../utils/image-utils', () => ({
  getImageUrl: (path: string) => `asset://${path}`,
}));

describe('LazyPage', () => {
  const mockPage: ComicPage = {
    id: 1,
    comic_id: 1,
    page_number: 1,
    file_path: '/test/path.jpg',
    file_name: 'path.jpg',
    thumbnail_path: null,
    is_favorite: 0,
    view_count: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock IntersectionObserver to immediately trigger intersection
    vi.stubGlobal('IntersectionObserver', vi.fn().mockImplementation(function(this: any, callback: any) {
      this.observe = (element: Element) => {
        // Simulate intersection
        callback([{ isIntersecting: true, target: element }], {} as any);
      };
      this.unobserve = vi.fn();
      this.disconnect = vi.fn();
    }));
  });

  it('should render page number', () => {
    render(<LazyPage page={mockPage} zoomLevel={100} />);
    expect(screen.getByText('Page 1')).toBeDefined();
  });

  it('should render image when visible', () => {
    render(<LazyPage page={mockPage} zoomLevel={100} />);
    const img = screen.getByRole('img');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('asset:///test/path.jpg');
  });

  it('should call onVisible when intersecting', () => {
    const onVisible = vi.fn();
    render(<LazyPage page={mockPage} zoomLevel={100} onVisible={onVisible} />);
    expect(onVisible).toHaveBeenCalledWith(0); // 0-indexed
  });

  it('should work with callback refs', () => {
    const refCallback = vi.fn();
    render(<LazyPage page={mockPage} zoomLevel={100} ref={refCallback} />);
    expect(refCallback).toHaveBeenCalled();
    expect(refCallback.mock.calls[0][0]).not.toBeNull();
  });

  it('should show star icon if favorite', () => {
    // We need to look for the SVG or something that represents RxStarFilled
    // Since we are using react-icons, it might be hard to test for the exact component
    // but we can check if it renders something or if we mock it
    const { container } = render(<LazyPage page={mockPage} zoomLevel={100} isFavorite={true} />);
    // Just check if an SVG is present (there's only one for the star usually)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
