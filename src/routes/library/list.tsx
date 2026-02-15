import { createFileRoute } from '@tanstack/react-router';
import { GridPage, SortOption } from '../../components/grid-page';
import { ComicCard } from '../../components/comic-card';
import { useComics } from '../../hooks/use-comics';
import { useOpenComic } from '../../hooks/use-open-comic';
import { RxLayers } from 'react-icons/rx';
import { naturalSortComparator } from '../../utils/image-utils';
import { Comic } from '../../types/comic';

export const Route = createFileRoute('/library/list')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      search: (search.search as string) || '',
    };
  },
  component: LibraryList,
});

const sortOptions: SortOption<Comic>[] = [
  { label: 'Title', value: 'title', comparator: (a, b) => naturalSortComparator(a.title, b.title) },
  { label: 'Artist', value: 'artist', comparator: (a, b) => naturalSortComparator(a.artist || '', b.artist || '') },
  { label: 'Date Added', value: 'date', comparator: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() },
  { label: 'View Count', value: 'views', comparator: (a, b) => a.view_count - b.view_count },
  { label: 'Path', value: 'path', comparator: (a, b) => naturalSortComparator(a.path, b.path) },
  { label: 'Recently Opened', value: 'recent', comparator: (a, b) => {
    const timeA = a.last_opened_at ? new Date(a.last_opened_at).getTime() : 0;
    const timeB = b.last_opened_at ? new Date(b.last_opened_at).getTime() : 0;
    return timeA - timeB;
  }},
];

function LibraryList() {
  const { search } = Route.useSearch();
  const { comics, loading } = useComics();
  const openComic = useOpenComic();

  return (
    <GridPage
      type="comics"
      title="All Comics"
      icon={<RxLayers size={24} />}
      items={comics}
      loading={loading}
      renderItem={(comic) => (
        <ComicCard 
          key={comic.id} 
          comic={comic} 
          onOpen={openComic} 
        />
      )}
      searchFields={(comic) => [comic.title, comic.artist, comic.path]}
      initialSearchQuery={search}
      sortOptions={sortOptions}
      defaultSortKey="title"
      showFavoriteFilter
      showViewFilter
      showBookmarkFilter
      isFavorite={(c) => c.is_favorite === 1}
      isViewed={(c) => c.is_viewed === 1}
      isBookmarked={(c) => !!c.bookmark_page}
      noItemsMessage="No comics found. Configure indexing paths in Settings."
      itemHeight={450}
    />
  );
}
