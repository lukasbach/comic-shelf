import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScrollMode } from './scroll-mode';
import { Comic, ComicPage } from '../../types/comic';

// Mock useTabs
vi.mock('../../contexts/tab-context', () => ({
  useTabs: () => ({
    tabs: [{ id: 'active-tab', currentPage: 0, zoomLevel: 100, fitMode: 'width', viewMode: 'scroll', sidebarCollapsed: false }],
    activeTabId: 'active-tab',
    updateTab: vi.fn(),
  }),
}));

vi.mock('../../contexts/settings-context', () => ({
  useSettings: () => ({
    settings: { slideshowDelay: 5000 },
    updateSettings: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('../../contexts/viewer-ref-context', () => ({
  useViewerRef: () => ({
    scrollContainerRef: { current: null },
    scrollToPage: vi.fn(),
    registerScrollToPage: vi.fn(),
  }),
}));

// Mock components that might be complex to render
vi.mock('./viewer-sidebar', () => ({
  ViewerSidebar: () => <div data-testid="viewer-sidebar" />,
}));

// Mock image utils
vi.mock('../../utils/image-utils', () => ({
  getImageUrl: (path: string) => `asset://${path}`,
}));

describe('ScrollMode', () => {
    const mockComic: Comic = {
        id: 1,
        title: 'Test Comic',
        artist: 'Test Artist',
        series: 'Test Series',
        issue: '1',
        path: '/test/comic',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        view_count: 0,
        is_favorite: 0,
        is_viewed: 0,
        last_opened_at: null,
        bookmark_page: null,
        page_count: 2,
        cover_image_path: null,
        thumbnail_path: null,
        indexing_status: 'completed',
        indexing_error: null,
    };

    const mockPages: ComicPage[] = [
        { id: 1, comic_id: 1, page_number: 1, file_path: '/path/1.jpg', file_name: '1.jpg', thumbnail_path: null, is_favorite: 0, is_viewed: 0, view_count: 0, last_opened_at: null },
        { id: 2, comic_id: 1, page_number: 2, file_path: '/path/2.jpg', file_name: '2.jpg', thumbnail_path: null, is_favorite: 0, is_viewed: 0, view_count: 0, last_opened_at: null },
    ];

    beforeEach(() => {
        vi.stubGlobal('IntersectionObserver', vi.fn().mockImplementation(function(this: any) {
            this.observe = vi.fn();
            this.disconnect = vi.fn();
        }));
    });

    it('should render all pages', () => {
        render(<ScrollMode 
            comic={mockComic} 
            pages={mockPages} 
            onTogglePageFavorite={vi.fn()}
            onIncrementPageViewCount={vi.fn()}
            onDecrementPageViewCount={vi.fn()}
        />);
        expect(screen.getByText('Page 1')).toBeDefined();
        expect(screen.getByText('Page 2')).toBeDefined();
    });

    it('should render sidebar', () => {
        render(<ScrollMode 
            comic={mockComic} 
            pages={mockPages} 
            onTogglePageFavorite={vi.fn()}
            onIncrementPageViewCount={vi.fn()}
            onDecrementPageViewCount={vi.fn()}
        />);
        expect(screen.getByTestId('viewer-sidebar')).toBeDefined();
    });
});
