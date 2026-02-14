import React from 'react';
import { RxStarFilled, RxFileText } from 'react-icons/rx';
import type { FavoritePage } from '../hooks/use-favorite-pages';
import { getImageUrl } from '../utils/image-utils';

type FavoriteImageCardProps = {
  page: FavoritePage;
  onOpen: (comicId: number, pageNumber: number) => void;
};

export const FavoriteImageCard: React.FC<FavoriteImageCardProps> = ({ page, onOpen }) => {
  const thumbUrl = page.thumbnail_path ? getImageUrl(page.thumbnail_path) : getImageUrl(page.file_path);

  return (
    <div 
      className="group flex flex-col bg-card rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={() => onOpen(page.comic_id, page.page_number)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
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
        
        <div className="absolute top-2 right-2">
          <div className="bg-primary text-primary-foreground p-1 rounded-full shadow-md">
            <RxStarFilled size={16} />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white p-2 transform translate-y-full group-hover:translate-y-0 transition-transform">
          <p className="text-[10px] font-medium truncate">{page.comic_title}</p>
          <p className="text-[10px] opacity-80">Page {page.page_number}</p>
        </div>
      </div>
    </div>
  );
};
