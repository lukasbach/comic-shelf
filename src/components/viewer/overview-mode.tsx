import React from 'react';
import { Comic, ComicPage } from '../../types/comic';
import { PageThumbnail } from './page-thumbnail';
import { useTabs } from '../../contexts/tab-context';
import { Tab } from '../../stores/tab-store';

type OverviewModeProps = {
  comic: Comic;
  pages: ComicPage[];
};

export const OverviewMode: React.FC<OverviewModeProps> = ({ pages }) => {
  const { tabs, activeTabId, updateTab } = useTabs();
  const activeTab = tabs.find((t: Tab) => t.id === activeTabId);
  const currentPage = activeTab?.currentPage ?? 1;

  const handlePageClick = (pageNumber: number) => {
    if (activeTabId) {
      updateTab(activeTabId, {
        currentPage: pageNumber,
        viewMode: 'single',
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 p-6">
        {pages.map((page) => (
          <PageThumbnail
            key={page.id}
            page={page}
            isActive={page.page_number === currentPage}
            onClick={() => handlePageClick(page.page_number)}
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
