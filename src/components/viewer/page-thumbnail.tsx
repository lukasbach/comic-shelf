import React from 'react';
import { ComicPage } from '../../types/comic';
import { getImageUrl } from '../../utils/image-utils';
import { RxStarFilled } from 'react-icons/rx';

type PageThumbnailProps = {
  page: ComicPage;
  isActive: boolean;
  onClick: () => void;
};

export const PageThumbnail: React.FC<PageThumbnailProps> = ({ page, isActive, onClick }) => {
  const imageUrl = getImageUrl(page.thumbnail_path || page.file_path);

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-200 rounded-md overflow-hidden border-2 ${
        isActive ? 'border-blue-500 scale-105 z-10' : 'border-transparent hover:border-gray-400 hover:scale-102'
      }`}
      onClick={onClick}
    >
      <img
        src={imageUrl}
        alt={`Page ${page.page_number}`}
        className="w-full h-auto object-contain aspect-[3/4] bg-gray-100 dark:bg-gray-800"
        loading="lazy"
      />
      
      {/* Page number badge */}
      <div className="absolute bottom-1 right-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-mono">
        {page.page_number}
      </div>

      {/* Favorite indicator */}
      {page.is_favorite === 1 && (
        <div className="absolute top-1 left-1 drop-shadow-md">
          <RxStarFilled className="text-yellow-400 w-4 h-4" />
        </div>
      )}

      {/* Hover overlay hint */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
    </div>
  );
};
