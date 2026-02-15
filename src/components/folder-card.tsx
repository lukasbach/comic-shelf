import React from 'react';
import { RxArchive } from 'react-icons/rx';
import { getImageUrl } from '../utils/image-utils';
import { CardItem } from './card-item';

type FolderCardProps = {
  name: string;
  path: string;
  thumbnailPath?: string;
  comicCount: number;
  onClick: (path: string, e?: React.MouseEvent) => void;
  isFocused?: boolean;
};

export const FolderCard: React.FC<FolderCardProps> = ({ 
  name, 
  path,
  thumbnailPath, 
  comicCount, 
  onClick,
  isFocused
}) => {
  const coverUrl = thumbnailPath ? getImageUrl(thumbnailPath) : '';

  return (
    <CardItem
      title={name}
      imageUrl={coverUrl}
      onOpen={(e) => onClick(path, e)}
      isFocused={isFocused}
      imageClassName="opacity-60 group-hover:opacity-80"
      fallbackIcon={<RxArchive size={48} className="text-blue-500 drop-shadow-md" />}
      subtitle={
        <div className="flex flex-col gap-1 items-center justify-center absolute inset-0 pointer-events-none">
           <RxArchive size={48} className="text-blue-500 drop-shadow-md" />
           <span className="font-bold text-lg text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] line-clamp-3 text-center px-4">
            {name}
          </span>
          {comicCount > 0 && (
            <span className="text-sm font-medium text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              {comicCount} comics
            </span>
          )}
        </div>
      }
    />
  );
};
