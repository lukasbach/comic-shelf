import React from 'react';
import { ComicCard } from './comic-card';
import type { Comic } from '../types/comic';

type ComicGridProps = {
  comics: Comic[];
  onOpenComic: (comic: Comic) => void;
};

export const ComicGrid: React.FC<ComicGridProps> = ({ comics, onOpenComic }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {comics.map((comic) => (
        <ComicCard key={comic.id} comic={comic} onOpen={onOpenComic} />
      ))}
    </div>
  );
};
