import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SinglePageMode } from './single-page-mode';
import { Comic, ComicPage } from '../../types/comic';
import { useTabs } from '../../contexts/tab-context';
import { ViewerRefProvider, useViewerRef } from '../../contexts/viewer-ref-context';

// Mock dependecies
vi.mock('../../contexts/tab-context', () => ({
  useTabs: vi.fn(),
}));

vi.mock('../../contexts/viewer-ref-context', () => ({
  ViewerRefProvider: ({ children }: any) => children,
  useViewerRef: vi.fn(() => ({
    scrollContainerRef: { current: null },
    scrollToPage: vi.fn(),
    registerScrollToPage: vi.fn(),
    nextPage: vi.fn(),
    prevPage: vi.fn(),
    registerNextPage: vi.fn(),
    registerPrevPage: vi.fn(),
  })),
}));

vi.mock('../../contexts/settings-context', () => ({
  useSettings: () => ({
    settings: { slideshowDelay: 5000 },
    updateSettings: vi.fn(),
    isLoading: false,
  }),
}));

// Mock resolvePageImageUrl
vi.mock('../../services/page-source-utils', () => ({
  resolvePageImageUrl: vi.fn().mockImplementation((page: ComicPage) => Promise.resolve(`asset://${page.file_path}`)),
  resolvePagePreviewUrl: vi.fn().mockImplementation((page: ComicPage) => Promise.resolve(`asset://${page.thumbnail_path ?? page.file_path}`)),
}));

const mockComic: Comic = {
  id: 1,
  title: 'Test Comic',
  path: '/test/path',
  artist: 'Artist',
  series: 'Series',
  issue: '1',
  cover_image_path: null,
  page_count: 3,
  is_favorite: 0,
  last_opened_at: null,
  view_count: 0,
  created_at: '',
  updated_at: '',
  bookmark_page: null,
  indexing_status: 'completed',
  indexing_error: null,
};

const mockPages: ComicPage[] = [
  { id: 1, comic_id: 1, page_number: 1, file_path: '/p1.jpg', file_name: 'p1.jpg', thumbnail_path: null, thumbnail_exists: 0, is_favorite: 0, view_count: 0, last_opened_at: null },
  { id: 2, comic_id: 1, page_number: 2, file_path: '/p2.jpg', file_name: 'p2.jpg', thumbnail_path: null, thumbnail_exists: 0, is_favorite: 1, view_count: 0, last_opened_at: null },
  { id: 3, comic_id: 1, page_number: 3, file_path: '/p3.jpg', file_name: 'p3.jpg', thumbnail_path: null, thumbnail_exists: 0, is_favorite: 0, view_count: 0, last_opened_at: null },
];

describe('SinglePageMode', () => {
  const updateTab = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useTabs as any).mockReturnValue({
      tabs: [{ id: 'tab1', currentPage: 0, zoomLevel: 100, fitMode: 'width', viewMode: 'single', sidebarCollapsed: false }],
      activeTabId: 'tab1',
      updateTab,
    });
    (useViewerRef as any).mockReturnValue({
      scrollContainerRef: { current: { scrollTo: vi.fn() } }
    });
  });

  it('renders current page image', async () => {
    render(
      <ViewerRefProvider>
        <SinglePageMode comic={mockComic} pages={mockPages} onTogglePageFavorite={vi.fn()} onIncrementPageViewCount={vi.fn()} onDecrementPageViewCount={vi.fn()} onTogglePageViewed={vi.fn()} />
      </ViewerRefProvider>
    );
    const img = await screen.findByAltText('Page 1');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('asset:///p1.jpg');
  });

  it('navigates to next page on click', async () => {
    (useTabs as any).mockReturnValue({
      tabs: [{ id: 'tab1', currentPage: 0, zoomLevel: 100, fitMode: 'width', viewMode: 'single', sidebarCollapsed: true }],
      activeTabId: 'tab1',
      updateTab,
    });
    render(
      <ViewerRefProvider>
        <SinglePageMode comic={mockComic} pages={mockPages} onTogglePageFavorite={vi.fn()} onIncrementPageViewCount={vi.fn()} onDecrementPageViewCount={vi.fn()} onTogglePageViewed={vi.fn()} />
      </ViewerRefProvider>
    );
    await screen.findByAltText('Page 1');
    const nextButton = screen.getByLabelText('Next Page');
    fireEvent.click(nextButton);
    expect(updateTab).toHaveBeenCalledWith('tab1', { currentPage: 1 });
  });

  it('navigates to prev page on click', async () => {
    (useTabs as any).mockReturnValue({
      tabs: [{ id: 'tab1', currentPage: 1, zoomLevel: 100, fitMode: 'width', viewMode: 'single', sidebarCollapsed: true }],
      activeTabId: 'tab1',
      updateTab,
    });
    render(
      <ViewerRefProvider>
        <SinglePageMode comic={mockComic} pages={mockPages} onTogglePageFavorite={vi.fn()} onIncrementPageViewCount={vi.fn()} onDecrementPageViewCount={vi.fn()} onTogglePageViewed={vi.fn()} />
      </ViewerRefProvider>
    );
    await screen.findByAltText('Page 2');
    const prevButton = screen.getByLabelText('Previous Page');
    fireEvent.click(prevButton);
    expect(updateTab).toHaveBeenCalledWith('tab1', { currentPage: 0 });
  });

  it('wraps around to first page when clicking next on last page', async () => {
    (useTabs as any).mockReturnValue({
      tabs: [{ id: 'tab1', currentPage: 2, zoomLevel: 100, fitMode: 'width', viewMode: 'single', sidebarCollapsed: true }],
      activeTabId: 'tab1',
      updateTab,
    });
    render(
      <ViewerRefProvider>
        <SinglePageMode comic={mockComic} pages={mockPages} onTogglePageFavorite={vi.fn()} onIncrementPageViewCount={vi.fn()} onDecrementPageViewCount={vi.fn()} onTogglePageViewed={vi.fn()} />
      </ViewerRefProvider>
    );
    await screen.findByAltText('Page 3');
    const nextButton = screen.getByLabelText('Next Page');
    fireEvent.click(nextButton);
    expect(updateTab).toHaveBeenCalledWith('tab1', { currentPage: 0 });
  });

  it('wraps around to last page when clicking prev on first page', async () => {
    (useTabs as any).mockReturnValue({
      tabs: [{ id: 'tab1', currentPage: 0, zoomLevel: 100, fitMode: 'width', viewMode: 'single', sidebarCollapsed: true }],
      activeTabId: 'tab1',
      updateTab,
    });
    render(
      <ViewerRefProvider>
        <SinglePageMode comic={mockComic} pages={mockPages} onTogglePageFavorite={vi.fn()} onIncrementPageViewCount={vi.fn()} onDecrementPageViewCount={vi.fn()} onTogglePageViewed={vi.fn()} />
      </ViewerRefProvider>
    );
    await screen.findByAltText('Page 1');
    const prevButton = screen.getByLabelText('Previous Page');
    fireEvent.click(prevButton);
    expect(updateTab).toHaveBeenCalledWith('tab1', { currentPage: 2 });
  });

  it('toggles sidebar', async () => {
    render(
      <ViewerRefProvider>
        <SinglePageMode comic={mockComic} pages={mockPages} onTogglePageFavorite={vi.fn()} onIncrementPageViewCount={vi.fn()} onDecrementPageViewCount={vi.fn()} onTogglePageViewed={vi.fn()} />
      </ViewerRefProvider>
    );
    await screen.findByAltText('Page 1');
    const toggleButton = screen.getByTitle('Collapse Sidebar');
    fireEvent.click(toggleButton);
    expect(updateTab).toHaveBeenCalledWith('tab1', { sidebarCollapsed: true });
  });
});
