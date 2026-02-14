import React, { useState } from 'react';
import { RxChevronDown, RxChevronRight } from 'react-icons/rx';
import { LibraryGrid } from './library-grid';
import { ComicCard } from './comic-card';
import type { Comic } from '../types/comic';

type ArtistGroupProps = {
  artist: string;
  comics: Comic[];
  onOpenComic: (comic: Comic) => void;
};

export const ArtistGroup: React.FC<ArtistGroupProps> = ({ artist, comics, onOpenComic }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 last:border-0 last:pb-0">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xl font-bold hover:text-primary transition-colors text-left"
      >
        {isExpanded ? <RxChevronDown /> : <RxChevronRight />}
        <span>{artist}</span>
        <span className="text-sm font-normal text-muted-foreground ml-2 bg-muted px-2 py-0.5 rounded-full">
          {comics.length}
        </span>
      </button>
      
      {isExpanded && (
        <div className="pl-6">
          <LibraryGrid>
            {comics.map((comic) => (
              <ComicCard key={comic.id} comic={comic} onOpen={onOpenComic} />
            ))}
          </LibraryGrid>
        </div>
      )}
    </div>
  );
};
