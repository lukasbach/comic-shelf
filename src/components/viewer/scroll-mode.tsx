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

type ScrollModeProps = {
  comic: Comic;
  pages: ComicPage[];
  slideshowActive?: boolean;
  onTogglePageFavorite: (pageId: number) => void;
  onIncrementPageViewCount: (pageId: number) => void;
};

export const ScrollMode: React.FC<ScrollModeProps> = ({ 
  pages, 
  slideshowActive = false,
  onTogglePageFavorite,
  onIncrementPageViewCount
}) => {
  const { tabs, activeTabId, updateTab } = useTabs();
  const { settings } = useSettings();
  const activeTab = tabs.find((t: Tab) => t.id === activeTabId);
  
  const currentPage = activeTab?.currentPage ?? 0;
  const zoomLevel = activeTab?.zoomLevel ?? 100;
  const viewMode = activeTab?.viewMode ?? 'scroll';
  const isSidebarCollapsed = activeTab?.sidebarCollapsed ?? false;
  
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  return (
    <div className="flex h-full w-full overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 flex flex-col items-center"
          style={{ 
            overflowX: zoomLevel > 100 ? 'auto' : 'hidden',
          }}
        >
          <div 
            className="flex flex-col items-center gap-4"
            style={{ 
                width: zoomLevel > 100 ? `${zoomLevel}%` : '100%',
                maxWidth: zoomLevel > 100 ? 'none' : '800px' // Limit width in fit-width for readability if too wide
            }}
          >
            {pages.map((page, index) => (
              <LazyPage
                key={page.id}
                ref={(el) => { pageRefs.current[index] = el; }}
                page={page}
                zoomLevel={100} // Image should fill its LazyPage container (which is scaled by parent)
                isFavorite={page.is_favorite === 1}
                onToggleFavorite={() => onTogglePageFavorite(page.id)}
              />
            ))}
          </div>
        </div>

        <ScrollPageIndicator 
          currentPage={currentPage}
          totalPages={pages.length}
          isScrolling={isScrolling}
        />
      </div>

      <ViewerSidebar
        pages={pages}
        currentPage={currentPage}
        onPageSelect={handleGoToPage}
        zoomLevel={zoomLevel}
        onZoomChange={handleZoomChange}
        viewMode={viewMode}
        onViewModeChange={handleModeChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
    </div>
  );
};
