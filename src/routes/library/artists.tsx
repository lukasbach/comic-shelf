import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArtistCard } from '../../components/artist-card';
import { GridView } from '../../components/grid-view';
import { useArtists } from '../../hooks/use-artists';
import { RxSymbol, RxMagnifyingGlass } from 'react-icons/rx';
import { useState, useMemo } from 'react';

export const Route = createFileRoute('/library/artists')({
  component: LibraryArtists,
});

function LibraryArtists() {
  const { artists, loading } = useArtists();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArtists = useMemo(() => {
    if (!searchQuery) return artists;
    const q = searchQuery.toLowerCase();
    return artists.filter(a => (a.artist || 'Unknown Artist').toLowerCase().includes(q));
  }, [artists, searchQuery]);

  const handleArtistClick = (artist: string) => {
    navigate({
      to: '/library/list',
      search: { search: artist },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RxSymbol className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (artists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 text-center">
        <p className="text-lg font-medium">No artists found.</p>
        <p className="text-sm">Configure indexing paths in Settings.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between gap-4 p-6 pb-2">
        <h1 className="text-2xl font-bold whitespace-nowrap">Artists ({artists.length})</h1>
        
        <div className="relative flex-1 max-w-sm">
          <RxMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search artists..."
            className="w-full pl-10 pr-4 py-2 bg-muted rounded-md border border-transparent focus:border-primary focus:outline-none transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <GridView
        items={filteredArtists}
        renderItem={(artist) => (
          <ArtistCard 
            key={artist.artist || 'unknown'} 
            artist={artist} 
            onClick={handleArtistClick} 
          />
        )}
        emptyMessage="No artists found matching your search."
      />
    </div>
  );
}
