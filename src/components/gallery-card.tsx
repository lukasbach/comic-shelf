import React, { useState } from 'react';
import { Gallery } from '../types/gallery';
import { RxLayers, RxTrash, RxPencil1, RxEyeOpen, RxEyeClosed } from 'react-icons/rx';
import { CardItem } from './card-item';
import { ComicContextMenu, ComicDropdownMenu } from './comic-context-menu';
import { FavoriteButton } from './favorite-button';
import { ViewCounter } from './view-counter';
import * as galleryService from '../services/gallery-service';
import { getImageUrl } from '../utils/image-utils';
import { useSettings } from '../contexts/settings-context';

interface GalleryCardProps {
  gallery: Gallery;
  onClick: () => void;
  onDelete?: () => void;
  onRename?: () => void;
  onUpdate?: () => void;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({ gallery, onClick, onDelete, onRename, onUpdate }) => {
  const { settings } = useSettings();
  const [isFavorite, setIsFavorite] = useState(gallery.is_favorite === 1);
  const [isViewed, setIsViewed] = useState(!!gallery.last_opened_at);
  const [viewCount, setViewCount] = useState(gallery.view_count || 0);

  const handleToggleFavorite = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      setIsFavorite(!isFavorite);
      await galleryService.toggleGalleryFavorite(gallery.id);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to toggle gallery favorite:', error);
      setIsFavorite(isFavorite);
    }
  };

  const handleToggleViewed = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      setIsViewed(!isViewed);
      await galleryService.toggleGalleryViewed(gallery.id);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to toggle gallery viewed:', error);
      setIsViewed(!!gallery.last_opened_at);
    }
  };

  const handleIncrementViewCount = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      setViewCount(viewCount + 1);
      await galleryService.incrementGalleryViewCount(gallery.id);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to increment gallery view count:', error);
      setViewCount(viewCount);
    }
  };

  const handleDecrementViewCount = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      setViewCount(Math.max(0, viewCount - 1));
      await galleryService.decrementGalleryViewCount(gallery.id);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to decrement gallery view count:', error);
      setViewCount(viewCount);
    }
  };

  const extraItems = (
    <>
      {onRename && (
        <button
          onClick={(e) => { e.stopPropagation(); onRename(); }}
          className="flex items-center gap-2 px-2 py-1.5 text-sm outline-none cursor-default hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm transition-colors text-gray-700 dark:text-gray-200 w-full"
        >
          <RxPencil1 className="w-4 h-4" />
          <span>Rename Gallery</span>
        </button>
      )}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex items-center gap-2 px-2 py-1.5 text-sm outline-none cursor-default hover:bg-red-100 dark:hover:bg-red-900/30 rounded-sm transition-colors text-red-600 dark:text-red-400 w-full"
        >
          <RxTrash className="w-4 h-4" />
          <span>Delete Gallery</span>
        </button>
      )}
    </>
  );

  return (
    <CardItem
      title={gallery.name}
      onOpen={onClick}
      imageUrl={gallery.thumbnail_path ? getImageUrl(gallery.thumbnail_path) : null}
      fallbackIcon={<RxLayers size={48} className="text-slate-700 group-hover:text-pink-500/50 transition-colors" />}
      footer={
        <div className="flex items-center justify-between w-full text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tight">
          <span>{gallery.page_count} Pages</span>
        </div>
      }
      topRightIcons={
        <div className="flex flex-row-reverse items-center gap-1.5">
          <FavoriteButton 
            isFavorite={isFavorite} 
            onToggle={handleToggleFavorite} 
            size="sm"
            className={`w-6 h-6 bg-black/40 backdrop-blur-sm rounded-full text-white shadow-md transition-all ${isFavorite ? 'opacity-100 scale-100' : 'opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100'}`}
          />
          {settings.showViewCount && (
            <button
              onClick={handleToggleViewed}
              className={`w-6 h-6 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-full shadow-md transition-all ${isViewed ? 'opacity-100 scale-100 text-blue-400' : 'opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 text-white'} hover:bg-black/80`}
            >
              {isViewed ? <RxEyeOpen size={14} /> : <RxEyeClosed size={14} />}
            </button>
          )}
          <ComicDropdownMenu 
            gallery={gallery}
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
            extraItems={extraItems}
            className="w-6 h-6 bg-black/40 backdrop-blur-sm rounded-full text-white shadow-md opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 transition-all hover:bg-black/80"
          />
        </div>
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
          gallery={gallery}
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
          extraItems={extraItems}
        >
          {children}
        </ComicContextMenu>
      )}
    />
  );
};
