import React, { useMemo } from 'react';
import { Comic, ComicPage } from '../../types/comic';
import { PageThumbnail } from './page-thumbnail';
import { useTabs } from '../../contexts/tab-context';
import { Tab } from '../../stores/tab-store';
import { GridView } from '../grid-view';
import { useSettings } from '../../contexts/settings-context';

type OverviewModeProps = {
  comic: Comic;
  pages: ComicPage[];
  onTogglePageFavorite: (pageId: number) => void;
  onTogglePageViewed: (pageId: number) => void;
  onIncrementPageViewCount: (pageId: number) => void;
  onDecrementPageViewCount: (pageId: number) => void;
  isGallery?: boolean;
  onRemoveFromGallery?: (pageId: number) => void;
  onAddToGallery?: (pageId: number) => void;
};

export const OverviewMode: React.FC<OverviewModeProps> = ({ 
  pages, 
  onTogglePageFavorite, 
  onTogglePageViewed,
  onIncrementPageViewCount,
  onDecrementPageViewCount,
  isGallery,
  onRemoveFromGallery,
  onAddToGallery
}) => {
  const { tabs, activeTabId, updateTab } = useTabs();
  const { settings } = useSettings();
  const activeTab = tabs.find((t: Tab) => t.id === activeTabId);
  const currentPage = activeTab?.currentPage ?? 0;
  const gridSize = activeTab?.gridSize ?? 100;

  const columnsMap = useMemo(() => ({
    xl: Math.max(1, Math.round(10 * (100 / gridSize))),
    lg: Math.max(1, Math.round(8 * (100 / gridSize))),
    md: Math.max(1, Math.round(6 * (100 / gridSize))),
    sm: Math.max(1, Math.round(4 * (100 / gridSize))),
    default: Math.max(1, Math.round(2 * (100 / gridSize))),
  }), [gridSize]);

  const handlePageClick = (index: number) => {
    if (activeTabId) {
      updateTab(activeTabId, {
        currentPage: index,
        viewMode: 'single',
      });
    }
  };

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-500 italic">
        No pages found for this comic.
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <GridView
        items={pages || []}
        itemHeight={300 * (gridSize / 100)}
        columnsMap={columnsMap}
        focusedIndex={currentPage}
        onFocusedIndexChange={(index) => activeTabId && updateTab(activeTabId, { currentPage: index ?? 0 })}
        onActivateItem={(_, index) => handlePageClick(index)}
        renderItem={(page, index, isFocused) => (
          <PageThumbnail
            key={page.id}
            page={page}
            isActive={index === currentPage || isFocused}
            onClick={() => handlePageClick(index)}
            onToggleFavorite={() => onTogglePageFavorite(page.id)}
            onToggleViewed={() => onTogglePageViewed(page.id)}
            onIncrementViewCount={() => onIncrementPageViewCount(page.id)}
            onDecrementViewCount={() => onDecrementPageViewCount(page.id)}
            isGallery={isGallery}
            onRemoveFromGallery={() => onRemoveFromGallery?.(page.id)}
            onAddToGallery={() => onAddToGallery?.(page.id)}
            enableGalleries={settings.enableGalleries}
          />
        )}
      />
    </div>
  );
};
