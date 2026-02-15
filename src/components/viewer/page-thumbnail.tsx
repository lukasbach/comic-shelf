import React from 'react';
import { ComicPage } from '../../types/comic';
import { FavoriteButton } from '../favorite-button';
import { ViewCounter } from '../view-counter';
import { ComicContextMenu } from '../comic-context-menu';
import { RxLayers, RxCross2 } from 'react-icons/rx';
import { RenderedPageImage } from './rendered-page-image';

type PageThumbnailProps = {
  page: ComicPage;
  isActive: boolean;
  onClick: () => void;
  onToggleFavorite: () => void;
  onToggleViewed: () => void;
  onIncrementViewCount: () => void;
  onDecrementViewCount: () => void;
  isGallery?: boolean;
  onRemoveFromGallery?: () => void;
  onAddToGallery?: () => void;
  enableGalleries?: boolean;
};

export const PageThumbnail: React.FC<PageThumbnailProps> = ({ 
  page, 
  isActive, 
  onClick,
  onToggleFavorite,
  onToggleViewed,
  onIncrementViewCount,
  onDecrementViewCount,
  isGallery,
  onRemoveFromGallery,
  onAddToGallery,
  enableGalleries
}) => {
  const isViewed = !!page.last_opened_at;

  return (
    <ComicContextMenu 
      page={page} 
      isFavorite={page.is_favorite === 1}
      isViewed={isViewed}
      viewCount={page.view_count}
      onToggleFavorite={onToggleFavorite}
      onToggleViewed={onToggleViewed}
      onIncrementViewCount={onIncrementViewCount}
      onDecrementViewCount={onDecrementViewCount}
      onAddToGallery={enableGalleries && !isGallery ? onAddToGallery : undefined}
      onRemoveFromGallery={enableGalleries && isGallery ? onRemoveFromGallery : undefined}
    >
      <div
        className={`relative group cursor-pointer transition-all duration-200 rounded-md overflow-hidden border-2 ${
          isActive ? 'border-blue-500 scale-105 z-10' : 'border-transparent hover:border-gray-400 hover:scale-102'
        }`}
        onClick={onClick}
      >
        <RenderedPageImage
          page={page}
          alt={`Page ${page.page_number}`}
          className="w-full h-auto object-contain aspect-3/4 bg-gray-100 dark:bg-gray-800"
          preferThumbnail
        />
        
        {/* Page number badge */}
        <div className="absolute bottom-1 right-1 bg-black/40 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-mono">
          {page.page_number}
        </div>

        {/* Top-right corner icons */}
        <div className="absolute top-1 right-1 flex flex-row-reverse items-center gap-1 z-10">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ViewCounter 
              count={page.view_count} 
              onIncrement={(e) => { e.stopPropagation(); onIncrementViewCount(); }} 
              size="sm"
              className="bg-black/40 backdrop-blur-sm shadow-md"
            />
          </div>

          {enableGalleries && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              {isGallery ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveFromGallery?.(); }}
                  className="w-6 h-6 flex items-center justify-center bg-black/40 backdrop-blur-sm text-white rounded-full shadow-md hover:bg-red-600/80 transition-all"
                  title="Remove from Gallery"
                >
                  <RxCross2 size={14} />
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onAddToGallery?.(); }}
                  className="w-6 h-6 flex items-center justify-center bg-black/40 backdrop-blur-sm text-white rounded-full shadow-md hover:bg-pink-600/80 transition-all"
                  title="Add to Gallery"
                >
                  <RxLayers size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Favorite button (top-left) */}
        <div className={`absolute top-1 left-1 drop-shadow-md transition-opacity ${page.is_favorite === 1 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <FavoriteButton 
            isFavorite={page.is_favorite === 1} 
            onToggle={(e) => { e.stopPropagation(); onToggleFavorite(); }} 
            size="sm"
            className="w-6 h-6 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-full text-white shadow-md"
          />
        </div>
        
        {page.view_count > 0 && (
          <div className="absolute bottom-1 left-1 bg-black/40 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-mono group-hover:hidden">
            {page.view_count}v
          </div>
        )}

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
      </div>
    </ComicContextMenu>
  );
};
