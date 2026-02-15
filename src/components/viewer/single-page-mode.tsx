import React, { useEffect } from 'react';
import { Comic, ComicPage } from '../../types/comic';
import { PageImage } from './page-image';
import { PageNavigation } from './page-navigation';
import { ViewerSidebar } from './viewer-sidebar';
import { useTabs } from '../../contexts/tab-context';
import { Tab } from '../../stores/tab-store';
import { usePreloadImages } from '../../hooks/use-preload-images';
import { useSlideshowScroll } from '../../hooks/use-slideshow-scroll';
import { useSettings } from '../../contexts/settings-context';
import { useViewerRef } from '../../contexts/viewer-ref-context';

type SinglePageModeProps = {
  comic: Comic;
  pages: ComicPage[];
  slideshowActive?: boolean;
  onSlideshowComplete?: () => void;
  onTogglePageFavorite: (pageId: number) => void;
  onIncrementPageViewCount: (pageId: number) => void;
  onDecrementPageViewCount: (pageId: number) => void;
};

export const SinglePageMode: React.FC<SinglePageModeProps> = ({ 
  pages, 
  slideshowActive = false,
  onSlideshowComplete,
  onTogglePageFavorite,
  onIncrementPageViewCount,
  onDecrementPageViewCount
}) => {
  const { tabs, activeTabId, updateTab } = useTabs();
  const { settings } = useSettings();
  const activeTab = tabs.find((t: Tab) => t.id === activeTabId);
  
  const currentPage = activeTab?.currentPage ?? 0;
  const zoomLevel = activeTab?.zoomLevel ?? 100;
  const fitMode = activeTab?.fitMode ?? 'width';
  const viewMode = activeTab?.viewMode ?? 'single';
  const isSidebarCollapsed = activeTab?.sidebarCollapsed ?? false;
  
  const { scrollContainerRef: containerRef } = useViewerRef();

  // Preload adjacent images
  usePreloadImages(pages, currentPage);
  usePreloadImages(pages, currentPage);

  // Slideshow scroll logic
  useSlideshowScroll({
    containerRef,
    isActive: slideshowActive,
    delay: settings.slideshowDelay,
    zoomLevel,
    autoScrollEnabled: settings.slideshowAutoScroll,
    onScrollComplete: () => onSlideshowComplete?.(),
  });

  const currentPageData = pages[currentPage];

  const handleNextPage = () => {
    if (currentPage < pages.length - 1 && activeTabId) {
      updateTab(activeTabId, { currentPage: currentPage + 1 });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0 && activeTabId) {
      updateTab(activeTabId, { currentPage: currentPage - 1 });
    }
  };

  const handleGoToPage = (pageNumber: number) => {
    if (activeTabId) {
      updateTab(activeTabId, { currentPage: pageNumber });
    }
  };

  const handleZoomChange = (zoom: number) => {
    if (activeTabId) {
      updateTab(activeTabId, { zoomLevel: zoom });
    }
  };

  const handleFitModeChange = (mode: 'width' | 'none') => {
    if (activeTabId) {
      updateTab(activeTabId, { fitMode: mode });
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

  if (!currentPageData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No page data available.
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-hidden">
          <PageImage 
            page={currentPageData} 
            zoomLevel={zoomLevel} 
            fitMode={fitMode}
            containerRef={containerRef}
          />
        </div>
        <PageNavigation
          page={currentPageData}
          currentPage={currentPage}
          totalPages={pages.length}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          onGoToPage={handleGoToPage}
          isFavorite={currentPageData.is_favorite === 1}
          viewCount={currentPageData.view_count}
          onToggleFavorite={() => onTogglePageFavorite(currentPageData.id)}
          onIncrementViewCount={() => onIncrementPageViewCount(currentPageData.id)}
          onDecrementViewCount={() => onDecrementPageViewCount(currentPageData.id)}
        />
      </div>

      <ViewerSidebar
        pages={pages}
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
      />
    </div>
  );
};
