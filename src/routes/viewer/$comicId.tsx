import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useComicData } from '../../hooks/use-comic-data';
import { useTabs } from '../../contexts/tab-context';
import { LoadingSpinner } from '../../components/viewer/loading-spinner';
import { NotFound } from '../../components/viewer/not-found';
import { ViewerHeader } from '../../components/viewer/viewer-header';
import { OverviewMode } from '../../components/viewer/overview-mode';
import { SinglePageMode } from '../../components/viewer/single-page-mode';
import { ScrollMode } from '../../components/viewer/scroll-mode';
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
  const activeTab = tabs.find((t: Tab) => t.id === activeTabId);
  
  // Default to overview if no mode is set in tab
  const viewMode = activeTab?.viewMode ?? 'overview';

  const { comic, pages, loading, error } = useComicData(Number(comicId));

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
        return <SinglePageMode comic={comic} pages={pages} />;
      case 'scroll':
        return <ScrollMode comic={comic} pages={pages} />;
      default:
        return <OverviewMode comic={comic} pages={pages} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden">
      <ViewerHeader
        comic={comic}
        pageCount={pages.length}
        currentMode={viewMode}
        onModeChange={handleModeChange}
      />
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
