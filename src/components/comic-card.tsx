import React, { useState } from 'react';
import { RxFileText, RxEyeOpen, RxEyeClosed } from 'react-icons/rx';
import type { Comic } from '../types/comic';
import { getImageUrl } from '../utils/image-utils';
import * as comicService from '../services/comic-service';
import { FavoriteButton } from './favorite-button';
import { ViewCounter } from './view-counter';
import { ComicContextMenu, ComicDropdownMenu } from './comic-context-menu';

type ComicCardProps = {
  comic: Comic;
  onOpen: (comic: Comic, e?: React.MouseEvent) => void;
};

export const ComicCard: React.FC<ComicCardProps> = ({ comic, onOpen }) => {
  const [isFavorite, setIsFavorite] = useState(comic.is_favorite === 1);
  const [isViewed, setIsViewed] = useState(comic.is_viewed === 1);
  const [viewCount, setViewCount] = useState(comic.view_count);

  const handleToggleFavorite = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    try {
      // Optimistic update
      setIsFavorite(!isFavorite);
      await comicService.toggleFavorite(comic.id);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      setIsFavorite(isFavorite); // Revert on error
    }
  };

  const handleToggleViewed = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    try {
      // Optimistic update
      setIsViewed(!isViewed);
      await comicService.toggleViewed(comic.id);
    } catch (error) {
      console.error('Failed to toggle viewed:', error);
      setIsViewed(isViewed); // Revert on error
    }
  };

  const handleIncrementViewCount = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    try {
      // Optimistic update
      setViewCount(viewCount + 1);
      await comicService.incrementViewCount(comic.id);
    } catch (error) {
      console.error('Failed to increment view count:', error);
      setViewCount(viewCount); // Revert on error
    }
  };

  const handleDecrementViewCount = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    try {
      // Optimistic update
      const newCount = Math.max(0, viewCount - 1);
      setViewCount(newCount);
      await comicService.decrementViewCount(comic.id);
    } catch (error) {
      console.error('Failed to decrement view count:', error);
      setViewCount(viewCount); // Revert on error
    }
  };

  const coverUrl = comic.thumbnail_path 
    ? getImageUrl(comic.thumbnail_path) 
    : (comic.cover_image_path ? getImageUrl(comic.cover_image_path) : '');

  return (
    <ComicContextMenu 
      comic={comic} 
      isFavorite={isFavorite} 
      setIsFavorite={setIsFavorite}
      isViewed={isViewed}
      setIsViewed={setIsViewed}
      viewCount={viewCount}
      setViewCount={setViewCount}
      onToggleFavorite={handleToggleFavorite}
      onToggleViewed={handleToggleViewed}
      onIncrementViewCount={handleIncrementViewCount}
      onDecrementViewCount={handleDecrementViewCount}
    >
      <div 
        className="group flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-gray-900/30 hover:shadow-md transition-all cursor-pointer relative"
        onClick={(e) => onOpen(comic, e)}
        onAuxClick={(e) => {
          if (e.button === 1) {
            onOpen(comic, e);
          }
        }}
      >
        <div className="relative aspect-3/4 overflow-hidden bg-gray-100 dark:bg-gray-900">
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

          <div className="absolute top-2 right-2 flex flex-row-reverse items-center gap-1.5 z-10">
            <FavoriteButton 
              isFavorite={isFavorite} 
              onToggle={handleToggleFavorite} 
              size="sm"
              className={`w-7 h-7 bg-black/60 backdrop-blur-md rounded-full text-white shadow-lg transition-all ${isFavorite ? 'opacity-100 scale-100' : 'opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100'}`}
            />
            <button
              onClick={handleToggleViewed}
              className={`w-7 h-7 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-full shadow-lg transition-all ${isViewed ? 'opacity-100 scale-100 text-blue-400' : 'opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 text-white'} hover:bg-black/80`}
              title={isViewed ? "Mark as Unviewed" : "Mark as Viewed"}
            >
              {isViewed ? <RxEyeOpen size={16} /> : <RxEyeClosed size={16} />}
            </button>
            <ComicDropdownMenu 
              comic={comic}
              isFavorite={isFavorite}
              setIsFavorite={setIsFavorite}
              isViewed={isViewed}
              setIsViewed={setIsViewed}
              viewCount={viewCount}
              setViewCount={setViewCount}
              onToggleFavorite={handleToggleFavorite}
              onToggleViewed={handleToggleViewed}
              onIncrementViewCount={handleIncrementViewCount}
              onDecrementViewCount={handleDecrementViewCount}
              className="w-7 h-7 bg-black/60 backdrop-blur-md rounded-full text-white shadow-lg opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 transition-all hover:bg-black/90"
            />
          </div>

          <div className="absolute bottom-2 left-2 flex gap-1 z-10">
            <ViewCounter 
              count={viewCount} 
              onIncrement={handleIncrementViewCount} 
              size="sm"
            />
          </div>
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
    </ComicContextMenu>
  );
};

