import React, { useEffect } from 'react';
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
import { useViewerRef } from '../../contexts/viewer-ref-context';

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
  const { scrollContainerRef } = useViewerRef();
  const activeTab = tabs.find((t: Tab) => t.id === activeTabId);
  
  // Default to overview if no mode is set in tab
  const viewMode = activeTab?.viewMode ?? 'overview';

  const { 
    comic, 
    pages, 
    loading, 
    error, 
    toggleComicFavorite, 
    incrementComicViewCount,
    togglePageFavorite,
    incrementPageViewCount 
  } = useComicData(Number(comicId));

  const nextPage = React.useCallback(() => {
    if (activeTabId && activeTab) {
      const nextPageIndex = activeTab.currentPage + 1;
      if (nextPageIndex < pages.length) {
        updateTab(activeTabId, { currentPage: nextPageIndex });
      } else {
        // Loop back to start if at the end
        updateTab(activeTabId, { currentPage: 0 });
      }
    }
  }, [activeTabId, activeTab, pages.length]);

  const slideshow = useSlideshow({
    delay: settings.slideshowDelay,
    onAdvance: nextPage,
    useInternalTimer: false, // Scrollers handle timing
    enabled: viewMode !== 'overview' && !!activeTab?.slideshowActive,
  });

  // Sync tab state to slideshow
  useEffect(() => {
    if (activeTab?.slideshowActive && !slideshow.isActive && viewMode !== 'overview') {
      slideshow.start();
    } else if ((!activeTab?.slideshowActive || viewMode === 'overview') && slideshow.isActive) {
      slideshow.stop();
    }
  }, [activeTab?.slideshowActive, slideshow.isActive, viewMode]);

  // Sync slideshow state back to tab if it gets stopped internally
  useEffect(() => {
    if (activeTabId && activeTab && slideshow.isActive !== activeTab.slideshowActive) {
      updateTab(activeTabId, { slideshowActive: slideshow.isActive });
    }
  }, [slideshow.isActive, activeTabId]);

  // Sync search param page to tab state
  useEffect(() => {
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

  const toggleSlideshow = () => {
    if (activeTabId) {
      updateTab(activeTabId, { slideshowActive: !activeTab?.slideshowActive });
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
        return (
          <OverviewMode 
            comic={comic} 
            pages={pages} 
            onTogglePageFavorite={togglePageFavorite}
            onIncrementPageViewCount={incrementPageViewCount}
          />
        );
      case 'single':
        return (
          <SinglePageMode 
            comic={comic} 
            pages={pages} 
            slideshowActive={slideshow.isActive}
            onSlideshowComplete={nextPage}
            onTogglePageFavorite={togglePageFavorite}
            onIncrementPageViewCount={incrementPageViewCount}
          />
        );
      case 'scroll':
        return (
          <ScrollMode 
            comic={comic} 
            pages={pages} 
            slideshowActive={slideshow.isActive}
            onTogglePageFavorite={togglePageFavorite}
            onIncrementPageViewCount={incrementPageViewCount}
          />
        );
      default:
        return (
          <OverviewMode 
            comic={comic} 
            pages={pages} 
            onTogglePageFavorite={togglePageFavorite}
            onIncrementPageViewCount={incrementPageViewCount}
          />
        );
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
        onToggleSlideshow={toggleSlideshow}
        onToggleFavorite={toggleComicFavorite}
        onIncrementViewCount={incrementComicViewCount}
      />
      <div className="flex-1 overflow-hidden" ref={scrollContainerRef}>
        {renderContent()}
      </div>

      <SlideshowIndicator 
        isActive={slideshow.isActive}
        progress={slideshow.progress}
        onStop={() => updateTab(activeTabId!, { slideshowActive: false })}
        showProgress={viewMode === 'single'}
      />
    </div>
  );
}
