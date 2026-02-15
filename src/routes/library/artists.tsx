import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { GridPage, SortOption } from '../../components/grid-page';
import { ArtistCard } from '../../components/artist-card';
import { useArtists } from '../../hooks/use-artists';
import { RxPerson } from 'react-icons/rx';
import { ArtistMetadata } from '../../types/comic';
import { naturalSortComparator } from '../../utils/image-utils';

export const Route = createFileRoute('/library/artists')({
  component: LibraryArtists,
});

const sortOptions: SortOption<ArtistMetadata>[] = [
  { label: 'Name', value: 'name', comparator: (a, b) => naturalSortComparator(a.artist || '', b.artist || '') },
  { label: 'Comic Count', value: 'count', comparator: (a, b) => b.comic_count - a.comic_count },
];

function LibraryArtists() {
  const { artists, loading } = useArtists();
  const navigate = useNavigate();

  const handleArtistClick = (artist: string) => {
    navigate({
      to: '/library/list',
      search: { search: artist },
    });
  };

  return (
    <GridPage
      type="artists"
      title="Artists"
      icon={<RxPerson size={24} />}
      items={artists}
      loading={loading}
      onActivateItem={(artist) => handleArtistClick(artist.artist || 'Unknown Artist')}
      renderItem={(artist, _, isFocused) => (
        <ArtistCard 
          key={artist.artist || 'unknown'} 
          artist={artist} 
          onClick={handleArtistClick} 
          isFocused={isFocused}
        />
      )}
      searchFields={(artist) => [artist.artist]}
      sortOptions={sortOptions}
      defaultSortKey="name"
      noItemsMessage="No artists found. Configure indexing paths in Settings."
    />
  );
}
