import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { ComicGrid } from '../../components/comic-grid';
import { useComics } from '../../hooks/use-comics';
import { useOpenComic } from '../../hooks/use-open-comic';
import { RxSymbol, RxArrowDown, RxArrowUp } from 'react-icons/rx';

export const Route = createFileRoute('/library/list')({
  component: LibraryList,
});

type SortKey = 'title' | 'artist' | 'date' | 'views';

function LibraryList() {
  const { comics, loading } = useComics();
  const openComic = useOpenComic();
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortedComics = useMemo(() => {
    return [...comics].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'artist':
          comparison = (a.artist || '').localeCompare(b.artist || '');
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'views':
          comparison = a.view_count - b.view_count;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [comics, sortKey, sortOrder]);

  const toggleOrder = () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RxSymbol className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (comics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 text-center">
        <p className="text-lg font-medium">No comics found.</p>
        <p className="text-sm">Configure indexing paths in Settings.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 p-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Comics ({comics.length})</h1>
        
        <div className="flex items-center gap-2 bg-muted p-1 rounded-md">
          <select 
            value={sortKey} 
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="bg-transparent text-sm font-medium px-2 py-1 outline-none cursor-pointer"
          >
            <option value="title">Sort by Title</option>
            <option value="artist">Sort by Artist</option>
            <option value="date">Sort by Date Added</option>
            <option value="views">Sort by View Count</option>
          </select>
          <button 
            onClick={toggleOrder}
            className="p-1.5 hover:bg-background rounded transition-colors"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? <RxArrowUp /> : <RxArrowDown />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <ComicGrid comics={sortedComics} onOpenComic={openComic} />
      </div>
    </div>
  );
}
