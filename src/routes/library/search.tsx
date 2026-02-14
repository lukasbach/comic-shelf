import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { VirtualizedGrid } from '../../components/virtualized-grid';
import { ComicCard } from '../../components/comic-card';
import { useSearchComics } from '../../hooks/use-search-comics';
import { useOpenComic } from '../../hooks/use-open-comic';
import { RxSymbol, RxMagnifyingGlass } from 'react-icons/rx';

export const Route = createFileRoute('/library/search')({
  component: LibrarySearch,
});

function LibrarySearch() {
  const [query, setQuery] = useState('');
  const { comics, loading } = useSearchComics(query);
  const openComic = useOpenComic();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col h-full gap-6 p-6 overflow-hidden">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Search</h1>
        <div className="relative">
          <RxMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, artist, series, or issue..."
            className="w-full bg-muted pl-10 pr-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RxSymbol className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : query.trim() === '' ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
            <RxMagnifyingGlass size={48} className="mb-4 opacity-20" />
            <p className="text-lg">Enter a search query to find comics.</p>
          </div>
        ) : comics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
            <p className="text-lg">No comics match your search.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full gap-4">
            <p className="text-sm font-medium text-muted-foreground px-6 py-2">Found {comics.length} results</p>
            <VirtualizedGrid
              items={comics}
              className="flex-1"
              renderItem={(comic) => (
                <ComicCard key={comic.id} comic={comic} onOpen={openComic} />
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}
