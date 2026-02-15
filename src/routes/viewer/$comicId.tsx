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
  const { scrollToPage, registerNextPage, registerPrevPage } = useViewerRef();
  const activeTab = tabs.find((t: Tab) => t.id === activeTabId);
  const [showBookmarkPrompt, setShowBookmarkPrompt] = React.useState(false);
  const [promptHandled, setPromptHandled] = React.useState(false);
  
  // Default to overview if no mode is set in tab
  const viewMode = activeTab?.viewMode ?? 'overview';

  const { 
    comic, 
    pages, 
    loading, 
    error, 
    toggleComicFavorite, 
    toggleComicViewed,
    incrementComicViewCount,
    decrementComicViewCount,
    togglePageFavorite,
    incrementPageViewCount,
    decrementPageViewCount,
    markPageAsOpened,
    setBookmark,
    clearBookmark
  } = useComicData(Number(comicId));

  useEffect(() => {
    if (comic) {
      document.title = `Comic Shelf — ${comic.title}`;
    }
  }, [comic]);

  // Show prompt if bookmark exists and not already handled or explicitly requested via search
  useEffect(() => {
    if (!loading && comic && comic.bookmark_page !== null && !promptHandled && search.page === undefined) {
      // Check if current page is already at the bookmark or if we just opened this tab
      // If currentPage is 0 (default) and we have a bookmark, show prompt
      if (activeTab?.currentPage === 0) {
        setShowBookmarkPrompt(true);
      }
      setPromptHandled(true);
    }
  }, [loading, comic, promptHandled, search.page, activeTab?.currentPage]);

  // Update page last opened timestamp
  useEffect(() => {
    if (viewMode !== 'overview' && activeTab && pages.length > 0) {
      const pageIndex = activeTab.currentPage;
      if (pageIndex !== undefined && pageIndex >= 0 && pageIndex < pages.length) {
        markPageAsOpened(pages[pageIndex].id);
      }
    }
  }, [viewMode, activeTab?.currentPage, pages, markPageAsOpened]);

  const nextPage = React.useCallback(() => {
    if (activeTabId && activeTab && activeTab.currentPage !== undefined) {
      const nextPageIndex = activeTab.currentPage + 1;
      const targetIndex = nextPageIndex < pages.length ? nextPageIndex : 0;
      
      if (activeTab.viewMode === 'scroll') {
        scrollToPage(targetIndex, 'smooth');
      } else {
        updateTab(activeTabId, { currentPage: targetIndex });
      }
    }
  }, [activeTabId, activeTab, pages.length, scrollToPage, updateTab]);

  const prevPage = React.useCallback(() => {
    if (activeTabId && activeTab && activeTab.currentPage !== undefined) {
      const prevPageIndex = activeTab.currentPage - 1;
      const targetIndex = prevPageIndex >= 0 ? prevPageIndex : pages.length - 1;
      
      if (activeTab.viewMode === 'scroll') {
        scrollToPage(targetIndex, 'smooth');
      } else {
        updateTab(activeTabId, { currentPage: targetIndex });
      }
    }
  }, [activeTabId, activeTab, pages.length, scrollToPage, updateTab]);

  useEffect(() => {
    registerNextPage(nextPage);
    registerPrevPage(prevPage);
    return () => {
      registerNextPage(() => {});
      registerPrevPage(() => {});
    };
  }, [registerNextPage, registerPrevPage, nextPage, prevPage]);

  const handleJumpToBookmark = () => {
    if (activeTabId && comic && comic.bookmark_page !== null) {
      updateTab(activeTabId, { 
        currentPage: comic.bookmark_page,
        viewMode: 'single'
      });
      setShowBookmarkPrompt(false);
    }
  };

  const handleClearBookmark = async () => {
    await clearBookmark();
    setShowBookmarkPrompt(false);
  };

  const handleSetBookmark = async () => {
    if (activeTab && activeTab.currentPage !== undefined) {
      await setBookmark(activeTab.currentPage);
    }
  };

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
            onDecrementPageViewCount={decrementPageViewCount}
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
            onDecrementPageViewCount={decrementPageViewCount}
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
            onDecrementPageViewCount={decrementPageViewCount}
          />
        );
      default:
        return (
          <OverviewMode 
            comic={comic} 
            pages={pages} 
            onTogglePageFavorite={togglePageFavorite}
            onIncrementPageViewCount={incrementPageViewCount}
            onDecrementPageViewCount={decrementPageViewCount}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
      <ViewerHeader
        comic={comic}
        pageCount={pages.length}
        currentMode={viewMode}
        onModeChange={handleModeChange}
        isSlideshowActive={slideshow.isActive}
        onToggleSlideshow={toggleSlideshow}
        onToggleFavorite={toggleComicFavorite}
        onToggleViewed={toggleComicViewed}
        onIncrementViewCount={incrementComicViewCount}
        onDecrementViewCount={decrementComicViewCount}
        onSetBookmark={handleSetBookmark}
        onJumpToBookmark={handleJumpToBookmark}
        onClearBookmark={handleClearBookmark}
        currentPage={activeTab?.currentPage}
      />
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {showBookmarkPrompt && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-2">Continue reading?</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              You have a bookmark on page {comic.bookmark_page! + 1}. Would you like to jump there?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleJumpToBookmark}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                Jump to Page {comic.bookmark_page! + 1}
              </button>
              <button
                onClick={() => setShowBookmarkPrompt(false)}
                className="w-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 font-semibold py-2 px-4 rounded transition-colors"
              >
                Start from Beginning
              </button>
              <button
                onClick={handleClearBookmark}
                className="w-full text-red-600 dark:text-red-400 text-sm py-2 hover:underline"
              >
                Clear Bookmark
              </button>
            </div>
          </div>
        </div>
      )}

      <SlideshowIndicator 
        isActive={slideshow.isActive}
        progress={slideshow.progress}
        onStop={() => updateTab(activeTabId!, { slideshowActive: false })}
        showProgress={viewMode === 'single'}
      />
    </div>
  );
}
