import { createFileRoute } from '@tanstack/react-router';
import { useComicData } from '../../hooks/use-comic-data';
import { useTabs } from '../../contexts/tab-context';
import { LoadingSpinner } from '../../components/viewer/loading-spinner';
import { NotFound } from '../../components/viewer/not-found';
import { ViewerHeader } from '../../components/viewer/viewer-header';
import { OverviewMode } from '../../components/viewer/overview-mode';
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
  const { tabs, activeTabId, updateTab } = useTabs();
  const activeTab = tabs.find((t: Tab) => t.id === activeTabId);
  
  // Default to overview if no mode is set in tab
  const viewMode = activeTab?.viewMode ?? 'overview';

  const { comic, pages, loading, error } = useComicData(Number(comicId));

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
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
            <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Single Page Mode</h3>
              <p className="text-gray-600 dark:text-gray-400">Coming soon in Task 7</p>
              <p className="mt-4 text-sm font-mono text-blue-500">Viewing page {activeTab?.currentPage ?? 1}</p>
              <button 
                onClick={() => handleModeChange('overview')}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Back to Overview
              </button>
            </div>
          </div>
        );
      case 'scroll':
        return (
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
            <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Scroll Mode</h3>
              <p className="text-gray-600 dark:text-gray-400">Coming soon in Task 8</p>
              <button 
                onClick={() => handleModeChange('overview')}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Back to Overview
              </button>
            </div>
          </div>
        );
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
