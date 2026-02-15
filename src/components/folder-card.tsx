import React from 'react';
import { RxArchive } from 'react-icons/rx';
import { getImageUrl } from '../utils/image-utils';

type FolderCardProps = {
  name: string;
  path: string;
  thumbnailPath?: string;
  comicCount: number;
  onClick: (path: string, e?: React.MouseEvent) => void;
};

export const FolderCard: React.FC<FolderCardProps> = ({ 
  name, 
  path,
  thumbnailPath, 
  comicCount, 
  onClick 
}) => {
  const coverUrl = thumbnailPath ? getImageUrl(thumbnailPath) : '';

  return (
    <div 
      className="group flex flex-col bg-card rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-all cursor-pointer relative"
      onClick={(e) => onClick(path, e)}
      onAuxClick={(e) => {
        if (e.button === 1) {
          onClick(path, e);
        }
      }}
    >
      <div className="relative aspect-3/4 overflow-hidden bg-muted flex items-center justify-center">
        {coverUrl ? (
          <img 
            src={coverUrl} 
            alt={name} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105 opacity-60 group-hover:opacity-80"
            loading="lazy"
          />
        ) : null}
        
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-colors pointer-events-none" />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
          <RxArchive size={48} className="text-blue-500 drop-shadow-md" />
          <span className="font-bold text-lg text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] line-clamp-3">
            {name}
          </span>
          {comicCount > 0 && (
            <span className="text-sm font-medium text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              {comicCount} comics
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
