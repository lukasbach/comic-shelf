import React from 'react';
import { RxFileText } from 'react-icons/rx';
import type { FavoritePage } from '../hooks/use-favorite-pages';
import { getImageUrl } from '../utils/image-utils';
import { ComicContextMenu, ComicDropdownMenu } from './comic-context-menu';
import { FavoriteButton } from './favorite-button';

type FavoriteImageCardProps = {
  page: FavoritePage;
  onOpen: (comicId: number, pageNumber: number) => void;
};

export const FavoriteImageCard: React.FC<FavoriteImageCardProps> = ({ page, onOpen }) => {
  const thumbUrl = page.thumbnail_path ? getImageUrl(page.thumbnail_path) : getImageUrl(page.file_path);

  const handleToggleFavorite = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    // This is handled by context menu and hooks usually, 
    // but for the card we might need a direct way if we add a button
  };

  return (
    <ComicContextMenu 
      page={page} 
      onOpen={() => onOpen(page.comic_id, page.page_number)}
      isFavorite={page.is_favorite === 1}
      viewCount={page.view_count}
    >
      <div 
        className="group flex flex-col bg-card rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-all cursor-pointer relative"
        onClick={() => onOpen(page.comic_id, page.page_number)}
      >
        <div className="relative aspect-3/4 overflow-hidden bg-muted">
          {thumbUrl ? (
            <img 
              src={thumbUrl} 
              alt={`${page.comic_title} - Page ${page.page_number}`} 
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
              isFavorite={page.is_favorite === 1} 
              onToggle={() => {}} // Hooked up via context menu usually, but here we'd need to lift state if we want optimistic updates like ComicCard
              size="sm"
              className={`w-7 h-7 bg-black/60 backdrop-blur-md rounded-full text-white shadow-lg transition-all ${page.is_favorite === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100'}`}
            />
            <ComicDropdownMenu 
              page={page}
              isFavorite={page.is_favorite === 1}
              viewCount={page.view_count}
              className="w-7 h-7 bg-black/60 backdrop-blur-md rounded-full text-white shadow-lg opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 transition-all hover:bg-black/90"
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white p-2 transform translate-y-full group-hover:translate-y-0 transition-transform">
            <p className="text-[10px] font-medium truncate">{page.comic_title}</p>
            <p className="text-[10px] opacity-80">Page {page.page_number}</p>
          </div>
        </div>
      </div>
    </ComicContextMenu>
  );
};
