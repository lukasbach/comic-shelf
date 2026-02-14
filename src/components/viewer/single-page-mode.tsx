import React, { useRef } from 'react';
import { Comic, ComicPage } from '../../types/comic';
import { PageImage } from './page-image';
import { PageNavigation } from './page-navigation';
import { ViewerSidebar } from './viewer-sidebar';
import { useTabs } from '../../contexts/tab-context';
import { Tab } from '../../stores/tab-store';
import { usePreloadImages } from '../../hooks/use-preload-images';

type SinglePageModeProps = {
  comic: Comic;
  pages: ComicPage[];
};

export const SinglePageMode: React.FC<SinglePageModeProps> = ({ pages }) => {
  const { tabs, activeTabId, updateTab } = useTabs();
  const activeTab = tabs.find((t: Tab) => t.id === activeTabId);
  
  const currentPage = activeTab?.currentPage ?? 0;
  const zoomLevel = activeTab?.zoomLevel ?? 100;
  const viewMode = activeTab?.viewMode ?? 'single';
  const isSidebarCollapsed = activeTab?.sidebarCollapsed ?? false;
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload adjacent images
  usePreloadImages(pages, currentPage);

  const currentPageData = pages[currentPage];

  const handleNextPage = () => {
    if (currentPage < pages.length - 1 && activeTabId) {
      updateTab(activeTabId, { currentPage: currentPage + 1 });
      // Scroll to top on page change
      if (containerRef.current?.scrollTo) {
        containerRef.current.scrollTo(0, 0);
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0 && activeTabId) {
      updateTab(activeTabId, { currentPage: currentPage - 1 });
      // Scroll to top on page change
      if (containerRef.current?.scrollTo) {
        containerRef.current.scrollTo(0, 0);
      }
    }
  };

  const handleGoToPage = (pageNumber: number) => {
    if (activeTabId) {
      updateTab(activeTabId, { currentPage: pageNumber });
      if (containerRef.current?.scrollTo) {
        containerRef.current.scrollTo(0, 0);
      }
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
            containerRef={containerRef}
          />
        </div>
        <PageNavigation
          currentPage={currentPage}
          totalPages={pages.length}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          onGoToPage={handleGoToPage}
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
