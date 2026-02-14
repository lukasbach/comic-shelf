import React, { useState } from 'react';
import { RxStarFilled, RxEyeOpen, RxFileText } from 'react-icons/rx';
import type { Comic } from '../types/comic';
import { getImageUrl } from '../utils/image-utils';
import * as comicService from '../services/comic-service';

type ComicCardProps = {
  comic: Comic;
  onOpen: (comic: Comic) => void;
};

export const ComicCard: React.FC<ComicCardProps> = ({ comic, onOpen }) => {
  const [isFavorite, setIsFavorite] = useState(comic.is_favorite === 1);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await comicService.toggleFavorite(comic.id);
    setIsFavorite(!isFavorite);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    handleToggleFavorite(e);
  };

  const coverUrl = comic.thumbnail_path 
    ? getImageUrl(comic.thumbnail_path) 
    : (comic.cover_image_path ? getImageUrl(comic.cover_image_path) : '');

  return (
    <div 
      className="group flex flex-col bg-card rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={() => onOpen(comic)}
      onContextMenu={handleContextMenu}
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
        
        <div className="absolute top-2 right-2 flex gap-1">
          {isFavorite && (
            <div className="bg-primary text-primary-foreground p-1 rounded-full shadow-md">
              <RxStarFilled size={16} />
            </div>
          )}
          {comic.view_count > 0 && (
            <div className="bg-background/80 backdrop-blur-sm text-foreground px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm">
              <RxEyeOpen size={10} />
              {comic.view_count}
            </div>
          )}
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
  );
};
