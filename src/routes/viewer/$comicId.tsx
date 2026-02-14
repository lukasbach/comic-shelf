import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useComicData } from '../../hooks/use-comic-data';
import { useTabs } from '../../contexts/tab-context';
import { useSettings } from '../../contexts/settings-context';
import { useSlideshow } from '../../hooks/use-slideshow';
import { LoadingSpinner } from '../../components/viewer/loading-spinner';
import { NotFound } from '../../components/viewer/not-found';
import { ViewerHeader } from '../../components/viewer/viewer-header';
import { OverviewMode } from '../../components/viewer/overview-mode';
import { SinglePageMode } from '../../components/viewer/single-page-mode';
import { ScrollMode } from '../../components/viewer/scroll-mode';
import { SlideshowIndicator } from '../../components/viewer/slideshow-indicator';
import { Tab } from '../../stores/tab-store';

type ComicViewerSearch = {
  page?: number;
};

export const Route = createFileRoute('/viewer/$comicId')({
  validateSearch: (search: Record<string, unknown>): ComicViewerSearch => {
    return {
      page: search.page ? Number(search.page) : undefined,
    };
  },
  component: ComicViewerPage,
});

function ComicViewerPage() {
  const { comicId } = Route.useParams();
  const search = Route.useSearch();
  const { tabs, activeTabId, updateTab } = useTabs();
  const { settings } = useSettings();
  const activeTab = tabs.find((t: Tab) => t.id === activeTabId);
  
  // Default to overview if no mode is set in tab
  const viewMode = activeTab?.viewMode ?? 'overview';

  const { comic, pages, loading, error } = useComicData(Number(comicId));

  const nextPage = React.useCallback(() => {
    if (activeTabId && activeTab) {
      const nextPageIndex = activeTab.currentPage + 1;
      if (nextPageIndex < pages.length) {
        updateTab(activeTabId, { currentPage: nextPageIndex });
      } else {
        // We can't easily call slideshow.stop() here due to circular dependency in definition
        // but we can just let nothing happen or the hooks will handle it.
      }
    }
  }, [activeTabId, activeTab, pages.length]);

  const slideshow = useSlideshow({
    delay: settings.slideshowDelay,
    onAdvance: nextPage,
    useInternalTimer: false, // Scrollers handle timing
    enabled: viewMode !== 'overview',
  });

  // Stop slideshow if we reached the end
  React.useEffect(() => {
    if (slideshow.isActive && activeTab && activeTab.currentPage >= pages.length - 1 && viewMode === 'single') {
      // In single page mode, stop at the last page
      // Unless we want to loop, but requirements say "At the last page, stop (or optionally loop)"
      // Let's settle for stop for now.
      // We need a timeout to let the last page be seen if we were scrolling.
    }
  }, [activeTab?.currentPage, pages.length, slideshow.isActive, viewMode]);

  // Stop slideshow if mode changes to overview
  React.useEffect(() => {
    if (viewMode === 'overview' && slideshow.isActive) {
      slideshow.stop();
    }
  }, [viewMode, slideshow.isActive]);

  // Sync search param page to tab state
  React.useEffect(() => {
    if (search.page !== undefined && activeTabId && pages.length > 0) {
      const pageIndex = search.page - 1;
      if (pageIndex >= 0 && pageIndex < pages.length && activeTab?.currentPage !== pageIndex) {
        updateTab(activeTabId, { 
          currentPage: pageIndex,
          viewMode: 'single'
        });
      }
    }
  }, [search.page, activeTabId, pages.length]);

  const handleModeChange = (mode: 'overview' | 'single' | 'scroll') => {
    if (activeTabId) {
      updateTab(activeTabId, { viewMode: mode });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !comic) {
    return <NotFound />;
  }

  const renderContent = () => {
    switch (viewMode) {
      case 'overview':
        return <OverviewMode comic={comic} pages={pages} />;
      case 'single':
        return (
          <SinglePageMode 
            comic={comic} 
            pages={pages} 
            slideshowActive={slideshow.isActive && !slideshow.isPaused}
            onSlideshowComplete={nextPage}
          />
        );
      case 'scroll':
        return (
          <ScrollMode 
            comic={comic} 
            pages={pages} 
            slideshowActive={slideshow.isActive && !slideshow.isPaused}
          />
        );
      default:
        return <OverviewMode comic={comic} pages={pages} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden relative">
      <ViewerHeader
        comic={comic}
        pageCount={pages.length}
        currentMode={viewMode}
        onModeChange={handleModeChange}
        isSlideshowActive={slideshow.isActive}
        isSlideshowPaused={slideshow.isPaused}
        onToggleSlideshow={slideshow.toggle}
      />
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      <SlideshowIndicator 
        isActive={slideshow.isActive}
        isPaused={slideshow.isPaused}
        progress={slideshow.progress}
        onTogglePause={slideshow.isPaused ? slideshow.resume : slideshow.pause}
        onStop={slideshow.stop}
        showProgress={viewMode === 'single'}
      />
    </div>
  );
}
