import React, { useState } from 'react';
import { RxFileText, RxStarFilled } from 'react-icons/rx';
import type { Comic } from '../types/comic';
import { getImageUrl } from '../utils/image-utils';
import * as comicService from '../services/comic-service';
import { FavoriteButton } from './favorite-button';
import { ViewCounter } from './view-counter';

type ComicCardProps = {
  comic: Comic;
  onOpen: (comic: Comic) => void;
};

export const ComicCard: React.FC<ComicCardProps> = ({ comic, onOpen }) => {
  const [isFavorite, setIsFavorite] = useState(comic.is_favorite === 1);
  const [viewCount, setViewCount] = useState(comic.view_count);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      // Optimistic update
      setIsFavorite(!isFavorite);
      await comicService.toggleFavorite(comic.id);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      setIsFavorite(isFavorite); // Revert on error
    }
  };

  const handleIncrementViewCount = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      // Optimistic update
      setViewCount(viewCount + 1);
      await comicService.incrementViewCount(comic.id);
    } catch (error) {
      console.error('Failed to increment view count:', error);
      setViewCount(viewCount); // Revert on error
    }
  };

  const coverUrl = comic.thumbnail_path 
    ? getImageUrl(comic.thumbnail_path) 
    : (comic.cover_image_path ? getImageUrl(comic.cover_image_path) : '');

  return (
    <div 
      className="group flex flex-col bg-card rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-all cursor-pointer relative"
      onClick={() => onOpen(comic)}
      onContextMenu={(e) => {
        e.preventDefault();
        handleToggleFavorite(e);
      }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {coverUrl ? (
          <img 
            src={coverUrl} 
            alt={comic.title} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <RxFileText size={48} />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-colors pointer-events-none" />

        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <FavoriteButton 
            isFavorite={isFavorite} 
            onToggle={handleToggleFavorite} 
            className="bg-black/40 backdrop-blur-sm p-1.5 rounded-full text-white shadow-lg"
          />
        </div>

        <div className="absolute bottom-2 left-2 flex gap-1 z-10">
          <ViewCounter 
            count={viewCount} 
            onIncrement={handleIncrementViewCount} 
            size="sm"
          />
        </div>

        {isFavorite && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-950 p-1 rounded-full shadow-md z-10 group-hover:hidden flex items-center justify-center">
            <RxStarFilled size={16} />
          </div>
        )}
      </div>
      
      <div className="p-3 flex flex-col gap-1 min-w-0">
        <h3 className="font-semibold text-sm truncate" title={comic.title}>
          {comic.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate" title={comic.artist || 'Unknown Artist'}>
          {comic.artist || 'Unknown Artist'}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {comic.series || ''}
          </span>
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
            {comic.page_count}P
          </span>
        </div>
      </div>
    </div>
  );
};
