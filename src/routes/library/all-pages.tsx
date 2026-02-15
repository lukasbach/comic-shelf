import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { VirtualizedGrid } from '../../components/virtualized-grid';
import { PageCard } from '../../components/page-card';
import { useAllPages } from '../../hooks/use-all-pages';
import { useOpenComicPage } from '../../hooks/use-open-comic-page';
import {
  RxSymbol,
  RxArrowDown,
  RxArrowUp,
  RxMagnifyingGlass,
  RxEyeOpen,
  RxEyeClosed,
  RxStar,
  RxStarFilled
} from 'react-icons/rx';
import { naturalSortComparator } from '../../utils/image-utils';

type SortKey = 'comic_title' | 'path' | 'views' | 'recent';
type ViewFilter = 'all' | 'viewed' | 'not-viewed';
type FavoriteFilter = 'all' | 'favorited' | 'not-favorited';

interface AllPagesSearchParams {
  search?: string;
  sort?: SortKey;
  order?: 'asc' | 'desc';
  view?: ViewFilter;
  favorite?: FavoriteFilter;
}

export const Route = createFileRoute('/library/all-pages')({
  validateSearch: (search: Record<string, unknown>): AllPagesSearchParams => {
    return {
      search: (search.search as string) || undefined,
      sort: (search.sort as SortKey) || 'recent',
      order: (search.order as 'asc' | 'desc') || 'desc',
      view: (search.view as ViewFilter) || 'all',
      favorite: (search.favorite as FavoriteFilter) || 'all',
    }
  },
  component: AllPagesList,
});

function AllPagesList() {
  const { search: searchQuery = '', sort: sortKey, order: sortOrder, view: viewFilter, favorite: favoriteFilter } = Route.useSearch();
  const navigate = useNavigate();
  const { pages, loading, refetch } = useAllPages();
  const openComicPage = useOpenComicPage();

  const setParams = (updates: Partial<AllPagesSearchParams>) => {
    navigate({
      to: '/library/all-pages',
      search: (prev: any) => ({ ...prev, ...updates }),
      replace: true,
    });
  };

  const setSearchQuery = (q: string) => setParams({ search: q || undefined });
  const setSortKey = (k: SortKey) => setParams({ sort: k });
  const setViewFilter = (v: ViewFilter) => setParams({ view: v });
  const setFavoriteFilter = (f: FavoriteFilter) => setParams({ favorite: f });
  const toggleOrder = () => setParams({ order: sortOrder === 'asc' ? 'desc' : 'asc' });

  const filteredAndSortedPages = useMemo(() => {
    let result = [...pages];

    const q = searchQuery.toLowerCase();
    if (q) {
      result = result.filter(p => 
        p.comic_title.toLowerCase().includes(q) || 
        (p.comic_artist || '').toLowerCase().includes(q) || 
        p.file_path.toLowerCase().includes(q)
      );
    }

    // View filter
    if (viewFilter === 'viewed') {
      result = result.filter(p => p.is_viewed === 1);
    } else if (viewFilter === 'not-viewed') {
      result = result.filter(p => p.is_viewed === 0);
    }

    // Favorite filter
    if (favoriteFilter === 'favorited') {
      result = result.filter(p => p.is_favorite === 1);
    } else if (favoriteFilter === 'not-favorited') {
      result = result.filter(p => p.is_favorite === 0);
    }

    // Sort
    return result.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'comic_title':
          comparison = naturalSortComparator(a.comic_title, b.comic_title);
          if (comparison === 0) {
            comparison = a.page_number - b.page_number;
          }
          break;
        case 'path':
          comparison = naturalSortComparator(a.file_path, b.file_path);
          break;
        case 'views':
          comparison = a.view_count - b.view_count;
          break;
        case 'recent':
          const timeA = a.last_opened_at ? new Date(a.last_opened_at).getTime() : 0;
          const timeB = b.last_opened_at ? new Date(b.last_opened_at).getTime() : 0;
          comparison = timeA - timeB;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [pages, sortKey, sortOrder, searchQuery, viewFilter, favoriteFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RxSymbol className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 p-6 overflow-hidden">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">All Pages ({filteredAndSortedPages.length})</h1>
          
          <div className="flex items-center gap-2 bg-muted p-1 rounded-md">
            <select 
              value={sortKey} 
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-transparent text-foreground text-sm font-medium px-2 py-1 outline-none cursor-pointer"
            >
              <option value="comic_title" className="bg-background text-foreground">Sort by Comic Title</option>
              <option value="path" className="bg-background text-foreground">Sort by Path</option>
              <option value="views" className="bg-background text-foreground">Sort by View Count</option>
              <option value="recent" className="bg-background text-foreground">Sort by Recently Opened</option>
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

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-50">
            <RxMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by comic title, author or path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted text-foreground border-none rounded-md py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-1">Filter:</span>
            
            <div className="flex items-center bg-muted rounded-md p-1">
              <button
                onClick={() => setViewFilter('all')}
                className={`px-3 py-1 text-xs rounded transition-colors ${viewFilter === `all` ? `bg-background shadow-sm` : `hover:bg-background/50`}`}
              >
                All
              </button>
              <button
                onClick={() => setViewFilter('viewed')}
                title="Viewed"
                className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${viewFilter === `viewed` ? `bg-background shadow-sm text-blue-500` : `hover:bg-background/50 text-muted-foreground`}`}
              >
                <RxEyeOpen /> Viewed
              </button>
              <button
                onClick={() => setViewFilter('not-viewed')}
                title="Not Viewed"
                className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${viewFilter === `not-viewed` ? `bg-background shadow-sm text-blue-500` : `hover:bg-background/50 text-muted-foreground`}`}
              >
                <RxEyeClosed /> Not Viewed
              </button>
            </div>

            <div className="flex items-center bg-muted rounded-md p-1">
              <button
                onClick={() => setFavoriteFilter('all')}
                className={`px-3 py-1 text-xs rounded transition-colors ${favoriteFilter === `all` ? `bg-background shadow-sm` : `hover:bg-background/50`}`}
              >
                All
              </button>
              <button
                onClick={() => setFavoriteFilter('favorited')}
                title="Favorited"
                className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${favoriteFilter === `favorited` ? `bg-background shadow-sm text-yellow-500` : `hover:bg-background/50 text-muted-foreground`}`}
              >
                <RxStarFilled /> Favs
              </button>
              <button
                onClick={() => setFavoriteFilter('not-favorited')}
                title="Not Favorited"
                className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${favoriteFilter === `not-favorited` ? `bg-background shadow-sm text-yellow-500` : `hover:bg-background/50 text-muted-foreground`}`}
              >
                <RxStar /> Not Favs
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {filteredAndSortedPages.length > 0 ? (
          <VirtualizedGrid
            items={filteredAndSortedPages}
            renderItem={(page) => (
              <PageCard key={page.id} page={page} onOpen={openComicPage} onUpdate={refetch} />
            )}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <p>No pages match your filters.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setViewFilter('all');
                setFavoriteFilter('all');
              }}
              className="text-primary hover:underline text-sm"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
