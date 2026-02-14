import React from 'react';
import { Comic, ComicPage } from '../../types/comic';
import { PageThumbnail } from './page-thumbnail';
import { useTabs } from '../../contexts/tab-context';
import { Tab } from '../../stores/tab-store';
import { useViewerRef } from '../../contexts/viewer-ref-context';

type OverviewModeProps = {
  comic: Comic;
  pages: ComicPage[];
  onTogglePageFavorite: (pageId: number) => void;
  onIncrementPageViewCount: (pageId: number) => void;
};

export const OverviewMode: React.FC<OverviewModeProps> = ({ 
  pages, 
  onTogglePageFavorite, 
  onIncrementPageViewCount 
}) => {
  const { tabs, activeTabId, updateTab } = useTabs();
  const activeTab = tabs.find((t: Tab) => t.id === activeTabId);
  const currentPage = activeTab?.currentPage ?? 0;
  const { scrollContainerRef } = useViewerRef();

  const handlePageClick = (index: number) => {
    if (activeTabId) {
      updateTab(activeTabId, {
        currentPage: index,
        viewMode: 'single',
      });
    }
  };

  return (
    <div ref={scrollContainerRef} className="h-full overflow-y-auto overflow-x-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 p-6">
        {pages.map((page, index) => (
          <PageThumbnail
            key={page.id}
            page={page}
            isActive={index === currentPage}
            onClick={() => handlePageClick(index)}
            onToggleFavorite={() => onTogglePageFavorite(page.id)}
            onIncrementViewCount={() => onIncrementPageViewCount(page.id)}
          />
        ))}
      </div>
      {pages.length === 0 && (
        <div className="flex items-center justify-center p-12 text-gray-500 italic">
          No pages found for this comic.
        </div>
      )}
    </div>
  );
};
