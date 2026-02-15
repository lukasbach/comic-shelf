import React, { useState } from 'react';
import { RxEyeOpen, RxEyeClosed } from 'react-icons/rx';
import { getImageUrl } from '../utils/image-utils';
import { ComicContextMenu, ComicDropdownMenu } from './comic-context-menu';
import { FavoriteButton } from './favorite-button';
import * as comicPageService from '../services/comic-page-service';
import { AllPageItem } from '../hooks/use-all-pages';
import { CardItem } from './card-item';

type PageCardProps = {
  page: AllPageItem;
  onOpen: (comicId: number, pageNumber: number, e?: React.MouseEvent, comicInfo?: { id: number; path: string; title: string }) => void;
  onUpdate?: () => void;
};

export const PageCard: React.FC<PageCardProps> = ({ page, onOpen, onUpdate }) => {
  const [isFavorite, setIsFavorite] = useState(page.is_favorite === 1);
  const [isViewed, setIsViewed] = useState(page.is_viewed === 1);
  const [viewCount, setViewCount] = useState(page.view_count);

  const thumbUrl = page.thumbnail_path ? getImageUrl(page.thumbnail_path) : getImageUrl(page.file_path);
  
  const handleToggleFavorite = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const newVal = !isFavorite;
      setIsFavorite(newVal);
      await comicPageService.togglePageFavorite(page.id);
      onUpdate?.();
    } catch (err) {
      console.error('Failed to toggle page favorite:', err);
      setIsFavorite(page.is_favorite === 1);
    }
  };

  const handleToggleViewed = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const newVal = !isViewed;
      setIsViewed(newVal);
      await comicPageService.togglePageViewed(page.id);
      onUpdate?.();
    } catch (err) {
      console.error('Failed to toggle page viewed:', err);
      setIsViewed(page.is_viewed === 1);
    }
  };

  const handleIncrementViewCount = async () => {
    try {
      setViewCount(prev => prev + 1);
      await comicPageService.incrementPageViewCount(page.id);
      onUpdate?.();
    } catch (err) {
      console.error('Failed to increment view count:', err);
      setViewCount(page.view_count);
    }
  };

  const handleDecrementViewCount = async () => {
    try {
      setViewCount(prev => Math.max(0, prev - 1));
      await comicPageService.decrementPageViewCount(page.id);
      onUpdate?.();
    } catch (err) {
      console.error('Failed to decrement view count:', err);
      setViewCount(page.view_count);
    }
  };

  return (
    <CardItem
      title={page.comic_title}
      imageUrl={thumbUrl}
      onOpen={(e) => onOpen(page.comic_id, page.page_number, e, { id: page.comic_id, title: page.comic_title, path: page.comic_path })}
      subtitle={<p className="text-[10px] opacity-80">Page {page.page_number}</p>}
      topRightIcons={
        <>
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
            page={page}
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
            onUpdate={onUpdate}
            className="w-7 h-7 bg-black/60 backdrop-blur-md rounded-full text-white shadow-lg opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 transition-all hover:bg-black/90"
          />
        </>
      }
      bottomLeftIcons={
        <div className="px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] text-white flex items-center gap-1 shadow-sm">
          <RxEyeOpen size={10} />
          <span>{viewCount}</span>
        </div>
      }
      contextMenu={(children) => (
        <ComicContextMenu 
          page={page} 
          onOpen={() => onOpen(page.comic_id, page.page_number, undefined, { id: page.comic_id, title: page.comic_title, path: page.comic_path })}
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
          onUpdate={onUpdate}
        >
          {children}
        </ComicContextMenu>
      )}
    />
  );
};

