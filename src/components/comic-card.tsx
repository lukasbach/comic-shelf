import React, { useState } from 'react';
import type { Comic } from '../types/comic';
import { getImageUrl } from '../utils/image-utils';
import * as comicService from '../services/comic-service';
import { ComicContextMenu, ComicDropdownMenu } from './comic-context-menu';
import { CardItem } from './card-item';
import { FavoriteButton } from './favorite-button';
import { ViewCounter } from './view-counter';
import { RxEyeOpen, RxEyeClosed } from 'react-icons/rx';
import { useSettings } from '../contexts/settings-context';

type ComicCardProps = {
  comic: Comic;
  onOpen: (comic: Comic, e?: React.MouseEvent) => void;
};

export const ComicCard: React.FC<ComicCardProps> = ({ comic, onOpen }) => {
  const { settings } = useSettings();
  const [isFavorite, setIsFavorite] = useState(comic.is_favorite === 1);
  const [isViewed, setIsViewed] = useState(comic.last_opened_at !== null);
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
      setViewCount((prev) => prev + 1);
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
      setViewCount((prev) => Math.max(0, prev - 1));
      await comicService.decrementViewCount(comic.id);
    } catch (error) {
      console.error('Failed to decrement view count:', error);
      setViewCount(viewCount); // Revert on error
    }
  };

  const coverUrl = comic.thumbnail_path 
    ? getImageUrl(comic.thumbnail_path) 
    : (comic.cover_image_path ? getImageUrl(comic.cover_image_path) : '');

  const isIndexing = comic.indexing_status === 'pending' || comic.indexing_status === 'processing';
  const isFailed = comic.indexing_status === 'failed';

  return (
    <CardItem
      title={comic.title}
      imageUrl={coverUrl}
      onOpen={(e) => onOpen(comic, e)}
      isIndexing={isIndexing}
      indexingLabel={comic.indexing_status === 'processing' ? 'Processing' : 'Pending'}
      isFailed={isFailed}
      failedTitle={comic.indexing_error || undefined}
      subtitle={
        <p className="text-xs text-muted-foreground truncate" title={comic.artist || 'Unknown Artist'}>
          {comic.artist || 'Unknown Artist'}
        </p>
      }
      footer={
        <>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {comic.series || ''}
          </span>
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
            {comic.page_count > 0 ? `${comic.page_count}P` : (isIndexing ? '...' : '0P')}
          </span>
        </>
      }
      topRightIcons={
        <>
          <FavoriteButton 
            isFavorite={isFavorite} 
            onToggle={handleToggleFavorite} 
            size="sm"
            className={`w-6 h-6 bg-black/40 backdrop-blur-sm rounded-full text-white shadow-md transition-all ${isFavorite ? 'opacity-100 scale-100' : 'opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100'}`}
          />
          {settings.showViewCount && (
            <button
              onClick={handleToggleViewed}
              onAuxClick={(e) => e.stopPropagation()}
              className={`w-6 h-6 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-full shadow-md transition-all ${isViewed ? 'opacity-100 scale-100 text-blue-400' : 'opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 text-white'} hover:bg-black/80`}
              title={isViewed ? "Mark as Unviewed" : "Mark as Viewed"}
            >
              {isViewed ? <RxEyeOpen size={14} /> : <RxEyeClosed size={14} />}
            </button>
          )}
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
            className="w-6 h-6 bg-black/40 backdrop-blur-sm rounded-full text-white shadow-md opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 transition-all hover:bg-black/80"
          />
        </>
      }
      bottomLeftIcons={
        <ViewCounter 
          count={viewCount} 
          onIncrement={handleIncrementViewCount} 
          size="sm"
        />
      }
      contextMenu={(children) => (
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
          {children}
        </ComicContextMenu>
      )}
    />
  );
};

