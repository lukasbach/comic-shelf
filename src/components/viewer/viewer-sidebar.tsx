import React from 'react';
import { ComicPage } from '../../types/comic';
import {
    RxGrid, RxFile, RxRows,
    RxChevronLeft, RxChevronRight,
    RxDoubleArrowLeft, RxDoubleArrowRight,
    RxStarFilled, RxLayers, RxCross2
} from 'react-icons/rx';
import { RenderedPageImage } from './rendered-page-image';
import { FavoriteButton } from '../favorite-button';
import { ViewCounter } from '../view-counter';
import { ComicContextMenu } from '../comic-context-menu';
import { useSettings } from '../../contexts/settings-context';

type ViewerSidebarProps = {
  pages: ComicPage[];
  currentPage: number;
  onPageSelect: (pageNumber: number) => void;
  zoomLevel: number;
  fitMode: 'width' | 'both' | 'none';
  onZoomChange: (zoom: number) => void;
  onFitModeChange: (fitMode: 'width' | 'both' | 'none') => void;
  viewMode: 'overview' | 'single' | 'scroll';
  onViewModeChange: (mode: 'overview' | 'single' | 'scroll') => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  page?: ComicPage;
  isFavorite?: boolean;
  isViewed?: boolean;
  viewCount?: number;
  onToggleFavorite?: () => void;
  onToggleViewed?: () => void;
  onIncrementViewCount?: () => void;
  onDecrementViewCount?: () => void;
  isGallery?: boolean;
  onRemoveFromGallery?: () => void;
  onAddToGallery?: () => void;
  enableGalleries?: boolean;
};

export const ViewerSidebar: React.FC<ViewerSidebarProps> = ({
  pages,
  currentPage,
  onPageSelect,
  zoomLevel,
  fitMode,
  onZoomChange,
  onFitModeChange,
  viewMode,
  onViewModeChange,
  isCollapsed,
  onToggleCollapse,
  page,
  isFavorite = false,
  isViewed = false,
  viewCount = 0,
  onToggleFavorite,
  onToggleViewed,
  onIncrementViewCount,
  onDecrementViewCount,
  isGallery,
  onRemoveFromGallery,
  onAddToGallery,
  enableGalleries,
}) => {
  const { settings } = useSettings();
  // Show next ~6 pages
  const upcomingPages = pages.slice(
    currentPage + 1,
    Math.min(pages.length, currentPage + 7)
  );

  if (isCollapsed) {
    return (
      <div className="w-10 h-full bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 gap-4">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          title="Expand Sidebar"
        >
          <RxDoubleArrowLeft className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 h-full bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-900">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Controls</h3>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Collapse Sidebar"
        >
          <RxDoubleArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-8">
        {/* View Mode Buttons */}
        <section>
          <h4 className="text-xs font-bold mb-3 text-gray-400 uppercase">View Mode</h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onViewModeChange('overview')}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                viewMode === 'overview'
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                  : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
              }`}
            >
              <RxGrid className="w-5 h-5" />
              <span className="text-[10px] font-medium">Grid</span>
            </button>
            <button
              onClick={() => onViewModeChange('single')}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                viewMode === 'single'
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                  : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
              }`}
            >
              <RxFile className="w-5 h-5" />
              <span className="text-[10px] font-medium">Single</span>
            </button>
            <button
              onClick={() => onViewModeChange('scroll')}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                viewMode === 'scroll'
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                  : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
              }`}
            >
              <RxRows className="w-5 h-5" />
              <span className="text-[10px] font-medium">Scroll</span>
            </button>
          </div>
        </section>

        {/* Zoom Controls */}
        <section>
          <h4 className="text-xs font-bold mb-3 text-gray-400 uppercase">
            {fitMode === 'width' ? 'Zoom: Fit Width' : fitMode === 'both' ? 'Zoom: Fit' : `Zoom: ${zoomLevel}%`}
          </h4>
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={zoomLevel}
            onChange={(e) => {
              onZoomChange(parseInt(e.target.value, 10));
              onFitModeChange('none');
            }}
            className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-4"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onFitModeChange('width')}
              className={`px-2 py-1.5 text-xs rounded transition-colors ${
                fitMode === 'width'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Fit Width
            </button>
            <button
              onClick={() => onFitModeChange('both')}
              className={`px-2 py-1.5 text-xs rounded transition-colors ${
                fitMode === 'both'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Fit
            </button>
            <button
              onClick={() => {
                onZoomChange(100);
                onFitModeChange('none');
              }}
              className={`px-2 py-1.5 text-xs rounded transition-colors ${
                fitMode === 'none' && zoomLevel === 100
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              100%
            </button>
            <button
              onClick={() => {
                onZoomChange(200);
                onFitModeChange('none');
              }}
              className={`px-2 py-1.5 text-xs rounded transition-colors ${
                fitMode === 'none' && zoomLevel === 200
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              200%
            </button>
          </div>
        </section>

        {/* Navigation Buttons (Duplicate of bottom bar) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase">Navigation</h4>
            <span className="text-xs font-medium text-gray-500">
              Page {currentPage + 1} / {pages.length}
            </span>
          </div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => onPageSelect(currentPage - 1 < 0 ? pages.length - 1 : currentPage - 1)}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 rounded transition-colors"
            >
              <RxChevronLeft className="w-5 h-5" />
              <span>Prev</span>
            </button>
            <button
              onClick={() => onPageSelect(currentPage + 1 >= pages.length ? 0 : currentPage + 1)}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 rounded transition-colors"
            >
              <span>Next</span>
              <RxChevronRight className="w-5 h-5" />
            </button>
          </div>

          {(onToggleFavorite || (onIncrementViewCount && settings.showViewCount)) && (
            <div className="flex items-center justify-center py-2 border-t border-gray-100 dark:border-gray-900 pt-4">
              <ComicContextMenu
                page={page}
                isFavorite={isFavorite}
                isViewed={isViewed}
                viewCount={viewCount}
                onToggleFavorite={onToggleFavorite}
                onToggleViewed={onToggleViewed}
                onIncrementViewCount={onIncrementViewCount}
                onDecrementViewCount={onDecrementViewCount}
              >
                <div className="flex items-center gap-6">
                  {enableGalleries && (
                    <>
                      {isGallery ? (
                        <button
                          onClick={onRemoveFromGallery}
                          className="p-1.5 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-all border border-red-500/30"
                          title="Remove from Gallery"
                        >
                          <RxCross2 size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={onAddToGallery}
                          className="p-1.5 bg-pink-600/10 text-pink-500 hover:bg-pink-600 hover:text-white rounded-lg transition-all border border-pink-500/30"
                          title="Add to Gallery"
                        >
                          <RxLayers size={18} />
                        </button>
                      )}
                    </>
                  )}
                  {onToggleFavorite && (
                    <FavoriteButton 
                      isFavorite={isFavorite} 
                      onToggle={onToggleFavorite} 
                      size="md"
                    />
                  )}
                  {onIncrementViewCount && (
                    <ViewCounter 
                      count={viewCount} 
                      onIncrement={onIncrementViewCount} 
                      size="md"
                    />
                  )}
                </div>
              </ComicContextMenu>
            </div>
          )}
        </section>

        {/* Upcoming Pages */}
        {upcomingPages.length > 0 && (
          <section>
            <h4 className="text-xs font-bold mb-3 text-gray-400 uppercase">Up Next</h4>
            <div className="grid grid-cols-3 gap-2">
              {upcomingPages.map((page, i) => (
                <button
                  key={page.id}
                  onClick={() => onPageSelect(currentPage + 1 + i)}
                  className="group relative aspect-3/4 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-900/50 hover:ring-2 hover:ring-blue-500 transition-all shadow-sm"
                  title={`Page ${page.page_number}`}
                >
                  <RenderedPageImage
                    page={page}
                    alt={`Page ${page.page_number}`}
                    className="w-full h-full object-cover transition-all"
                    preferThumbnail
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white py-0.5 text-[10px] font-bold text-center">
                    {page.page_number}
                  </div>
                  {page.is_favorite === 1 && (
                    <div className="absolute top-1 right-1">
                      <RxStarFilled className="w-3 h-3 text-yellow-500 drop-shadow-sm" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
