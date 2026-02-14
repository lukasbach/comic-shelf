import { createFileRoute } from '@tanstack/react-router';
import { ArtistGroup } from '../../components/artist-group';
import { useComicsByArtist } from '../../hooks/use-comics-by-artist';
import { useOpenComic } from '../../hooks/use-open-comic';
import { RxSymbol } from 'react-icons/rx';

export const Route = createFileRoute('/library/artists')({
  component: LibraryArtists,
});

function LibraryArtists() {
  const { groups, loading } = useComicsByArtist();
  const openComic = useOpenComic();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RxSymbol className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 text-center">
        <p className="text-lg font-medium">No artists found.</p>
        <p className="text-sm">Configure indexing paths in Settings.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 p-6 overflow-hidden">
      <h1 className="text-2xl font-bold">By Artist ({groups.length})</h1>

      <div className="flex-1 overflow-auto flex flex-col gap-8">
        {groups.map((group) => (
          <ArtistGroup 
            key={group.artist} 
            artist={group.artist} 
            comics={group.comics} 
            onOpenComic={openComic} 
          />
        ))}
      </div>
    </div>
  );
}
