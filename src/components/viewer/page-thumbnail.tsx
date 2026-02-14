import React from 'react';
import { ComicPage } from '../../types/comic';
import { FavoriteButton } from '../favorite-button';
import { ViewCounter } from '../view-counter';
import { ComicContextMenu } from '../comic-context-menu';
import { RenderedPageImage } from './rendered-page-image';

type PageThumbnailProps = {
  page: ComicPage;
  isActive: boolean;
  onClick: () => void;
  onToggleFavorite: () => void;
  onIncrementViewCount: () => void;
  onDecrementViewCount: () => void;
};

export const PageThumbnail: React.FC<PageThumbnailProps> = ({ 
  page, 
  isActive, 
  onClick,
  onToggleFavorite,
  onIncrementViewCount,
  onDecrementViewCount
}) => {
  return (
    <ComicContextMenu 
      page={page} 
      isFavorite={page.is_favorite === 1}
      viewCount={page.view_count}
      onToggleFavorite={onToggleFavorite}
      onIncrementViewCount={onIncrementViewCount}
      onDecrementViewCount={onDecrementViewCount}
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
        <div className="absolute bottom-1 right-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-mono">
          {page.page_number}
        </div>

        {/* Favorite button */}
        <div className={`absolute top-1 left-1 drop-shadow-md transition-opacity ${page.is_favorite === 1 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <FavoriteButton 
            isFavorite={page.is_favorite === 1} 
            onToggle={(e) => { e.stopPropagation(); onToggleFavorite(); }} 
            size="sm"
            className="bg-black/40 backdrop-blur-sm p-1 rounded-full text-white"
          />
        </div>

        {/* View counter */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ViewCounter 
            count={page.view_count} 
            onIncrement={(e) => { e.stopPropagation(); onIncrementViewCount(); }} 
            size="sm"
            className="bg-black/40 backdrop-blur-sm shadow-md"
          />
        </div>
        
        {page.view_count > 0 && (
          <div className="absolute bottom-1 left-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-mono group-hover:hidden">
            {page.view_count}v
          </div>
        )}

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
      </div>
    </ComicContextMenu>
  );
};
