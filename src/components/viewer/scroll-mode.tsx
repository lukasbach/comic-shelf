import React, { useRef, useEffect, useState } from 'react';
import { Comic, ComicPage } from '../../types/comic';
import { useTabs } from '../../contexts/tab-context';
import { Tab } from '../../stores/tab-store';
import { useScrollPageTracker } from '../../hooks/use-scroll-page-tracker';
import { LazyPage } from './lazy-page';
import { ScrollPageIndicator } from './scroll-page-indicator';
import { ViewerSidebar } from './viewer-sidebar';
import { useAutoScroll } from '../../hooks/use-auto-scroll';
import { useSettings } from '../../contexts/settings-context';
import { useViewerRef } from '../../contexts/viewer-ref-context';

type ScrollModeProps = {
  comic: Comic;
  pages: ComicPage[];
  slideshowActive?: boolean;
  onTogglePageFavorite: (pageId: number) => void;
  onTogglePageViewed: (pageId: number) => void;
  onIncrementPageViewCount: (pageId: number) => void;
  onDecrementPageViewCount: (pageId: number) => void;
  isGallery?: boolean;
  onRemoveFromGallery?: (pageId: number) => void;
  onAddToGallery?: (pageId: number) => void;
};

export const ScrollMode: React.FC<ScrollModeProps> = ({ 
  pages, 
  slideshowActive = false,
  onTogglePageFavorite,
  onTogglePageViewed,
  onIncrementPageViewCount,
  onDecrementPageViewCount,
  isGallery,
  onRemoveFromGallery,
  onAddToGallery
}) => {
  const { tabs, activeTabId, updateTab } = useTabs();
  const { settings } = useSettings();
  const activeTab = tabs.find((t: Tab) => t.id === activeTabId);
  
  const currentPage = activeTab?.currentPage ?? 0;
  const zoomLevel = activeTab?.zoomLevel ?? settings.defaultZoomLevel ?? 100;
  const fitMode = activeTab?.fitMode ?? settings.defaultFitMode ?? 'width';
  const viewMode = activeTab?.viewMode ?? 'scroll';
  const isSidebarCollapsed = activeTab?.sidebarCollapsed ?? false;
  
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const { scrollContainerRef: containerRef, registerScrollToPage, registerNextPage, registerPrevPage } = useViewerRef();
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Register scroll jump function
  useEffect(() => {
    registerScrollToPage((pageIndex, behavior = 'smooth') => {
      if (pageRefs.current[pageIndex]) {
        pageRefs.current[pageIndex]?.scrollIntoView({ behavior, block: 'start' });
      }
    });
    registerNextPage(() => {
      const nextIndex = currentPage + 1;
      if (nextIndex < pages.length) {
        handleGoToPage(nextIndex);
      } else {
        handleGoToPage(0);
      }
    });
    registerPrevPage(() => {
      const prevIndex = currentPage - 1;
      if (prevIndex >= 0) {
        handleGoToPage(prevIndex);
      } else {
        handleGoToPage(pages.length - 1);
      }
    });

    return () => {
      registerScrollToPage(() => {});
      registerNextPage(() => {});
      registerPrevPage(() => {});
    };
  }, [registerScrollToPage, registerNextPage, registerPrevPage, currentPage, pages.length]);

  // Initialize pageRefs array
  useEffect(() => {
    pageRefs.current = pageRefs.current.slice(0, pages.length);
  }, [pages.length]);

  // Slideshow auto-scroll logic
  useAutoScroll({
    containerRef,
    isActive: slideshowActive,
    delay: settings.slideshowDelay,
    totalPages: pages.length,
    autoScrollEnabled: settings.slideshowAutoScroll,
  });

  // Track scrolling state for indicator
  const handleScroll = () => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
    }, 150);
  };

  // Tracker for updating currentPage in tab state
  useScrollPageTracker(
    containerRef,
    pageRefs,
    (pageIndex) => {
      if (activeTabId && activeTab?.currentPage !== pageIndex) {
        updateTab(activeTabId, { currentPage: pageIndex });
      }
    }
  );

  // Initial scroll to current page
  useEffect(() => {
    const scrollToInitialPage = () => {
        if (currentPage > 0 && pageRefs.current[currentPage]) {
            pageRefs.current[currentPage]?.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
    };
    
    // Small delay to ensure refs are populated and layout is ready
    const timer = setTimeout(scrollToInitialPage, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleGoToPage = (pageNumber: number) => {
    if (activeTabId) {
      updateTab(activeTabId, { currentPage: pageNumber });
      pageRefs.current[pageNumber]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleZoomChange = (zoom: number) => {
    if (activeTabId) {
      updateTab(activeTabId, { zoomLevel: zoom });
    }
  };

  const handleFitModeChange = (mode: 'width' | 'both' | 'none') => {
    if (activeTabId) {
      updateTab(activeTabId, { fitMode: mode === 'both' ? 'width' : mode });
    }
  };

  const handleToggleSidebar = () => {
    if (activeTabId) {
      updateTab(activeTabId, { sidebarCollapsed: !isSidebarCollapsed });
    }
  };

  const handleModeChange = (mode: 'overview' | 'single' | 'scroll') => {
    if (activeTabId) {
      updateTab(activeTabId, { viewMode: mode });
    }
  };

  const currentPageData = pages[currentPage];

  return (
    <div className="flex h-full w-full overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-auto p-4 flex flex-col items-start justify-start"
        >
          <div 
            className="flex flex-col items-start gap-4 min-w-full w-fit mx-auto"
          >
            {pages.map((page, index) => (
            <LazyPage
              key={page.id}
              ref={(el: HTMLDivElement | null) => { pageRefs.current[index] = el; }}
              page={page}
              zoomLevel={zoomLevel}
              fitMode={fitMode}
              isFavorite={page.is_favorite === 1}
              isViewed={!!page.last_opened_at}
              onToggleFavorite={() => onTogglePageFavorite(page.id)}
              onToggleViewed={() => onTogglePageViewed(page.id)}
              onIncrementViewCount={() => onIncrementPageViewCount(page.id)}
              onDecrementViewCount={() => onDecrementPageViewCount(page.id)}
              isGallery={isGallery}
              onRemoveFromGallery={() => onRemoveFromGallery?.(page.id)}
              onAddToGallery={() => onAddToGallery?.(page.id)}
              enableGalleries={settings.enableGalleries}
            />
            ))}
          </div>
        </div>

        {isSidebarCollapsed && (
          <ScrollPageIndicator 
            currentPage={currentPage}
            totalPages={pages.length}
            isScrolling={isScrolling}
          />
        )}
      </div>

      <ViewerSidebar
        pages={pages}
        page={currentPageData}
        currentPage={currentPage}
        onPageSelect={handleGoToPage}
        zoomLevel={zoomLevel}
        fitMode={fitMode}
        onZoomChange={handleZoomChange}
        onFitModeChange={handleFitModeChange}
        viewMode={viewMode}
        onViewModeChange={handleModeChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        isFavorite={currentPageData?.is_favorite === 1}
        isViewed={!!currentPageData?.last_opened_at}
        viewCount={currentPageData?.view_count}
        onToggleFavorite={() => currentPageData && onTogglePageFavorite(currentPageData.id)}
        onToggleViewed={() => currentPageData && onTogglePageViewed(currentPageData.id)}
        onIncrementViewCount={() => currentPageData && onIncrementPageViewCount(currentPageData.id)}
        onDecrementViewCount={() => currentPageData && onDecrementPageViewCount(currentPageData.id)}
        isGallery={isGallery}
        onRemoveFromGallery={() => currentPageData && onRemoveFromGallery?.(currentPageData.id)}
        onAddToGallery={() => currentPageData && onAddToGallery?.(currentPageData.id)}
        enableGalleries={settings.enableGalleries}
      />
    </div>
  );
};
