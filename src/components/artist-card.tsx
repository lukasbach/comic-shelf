import React from 'react';
import type { ArtistMetadata } from '../types/comic';
import { getImageUrl } from '../utils/image-utils';
import { RxPerson } from 'react-icons/rx';

type ArtistCardProps = {
  artist: ArtistMetadata;
  onClick: (artist: string) => void;
};

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onClick }) => {
  const artistName = artist.artist || 'Unknown Artist';
  
  return (
    <div 
      className="group relative flex flex-col gap-2 cursor-pointer"
      onClick={() => onClick(artistName)}
    >
      <div className="aspect-[3/4] overflow-hidden rounded-md border bg-muted transition-colors group-hover:border-primary/50 flex items-center justify-center relative shadow-sm">
        {artist.thumbnail_path ? (
          <img
            src={getImageUrl(artist.thumbnail_path)}
            alt={artistName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
            <RxPerson size={48} />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex flex-col justify-end opacity-0 transition-opacity group-hover:opacity-100">
           <span className="text-white text-xs font-medium self-start bg-primary/80 px-2 py-0.5 rounded-full">
            {artist.comic_count} {artist.comic_count === 1 ? 'Comic' : 'Comics'}
           </span>
        </div>
      </div>
      
      <div className="flex flex-col">
        <h3 className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {artistName}
        </h3>
        <p className="text-xs text-muted-foreground">
          {artist.comic_count} {artist.comic_count === 1 ? 'comic' : 'comics'}
        </p>
      </div>
    </div>
  );
};
