import React from 'react';
import type { ArtistMetadata } from '../types/comic';
import { getImageUrl } from '../utils/image-utils';
import { RxPerson } from 'react-icons/rx';
import { CardItem } from './card-item';

type ArtistCardProps = {
  artist: ArtistMetadata;
  onClick: (artist: string) => void;
  isFocused?: boolean;
};

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onClick, isFocused }) => {
  const artistName = artist.artist || 'Unknown Artist';
  
  return (
    <CardItem
      title={artistName}
      imageUrl={artist.thumbnail_path ? getImageUrl(artist.thumbnail_path) : null}
      onOpen={() => onClick(artistName)}
      isFocused={isFocused}
      fallbackIcon={<RxPerson size={48} />}
      subtitle={
        <p className="text-xs text-muted-foreground">
          {artist.comic_count} {artist.comic_count === 1 ? 'comic' : 'comics'}
        </p>
      }
    />
  );
};
