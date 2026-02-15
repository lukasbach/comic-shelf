import { createFileRoute } from '@tanstack/react-router';
import { GridPage, SortOption } from '../../components/grid-page';
import { PageCard } from '../../components/page-card';
import { useAllPages, AllPageItem } from '../../hooks/use-all-pages';
import { useOpenComicPage } from '../../hooks/use-open-comic-page';
import { RxImage } from 'react-icons/rx';
import { naturalSortComparator } from '../../utils/image-utils';

export const Route = createFileRoute('/library/all-pages')({
  component: AllPagesList,
});

const sortOptions: SortOption<AllPageItem>[] = [
  { label: 'Comic Title', value: 'comic_title', comparator: (a, b) => {
    const cmp = naturalSortComparator(a.comic_title, b.comic_title);
    return cmp === 0 ? a.page_number - b.page_number : cmp;
  }},
  { label: 'Path', value: 'path', comparator: (a, b) => naturalSortComparator(a.file_path, b.file_path) },
  { label: 'View Count', value: 'views', comparator: (a, b) => a.view_count - b.view_count },
  { label: 'Recently Viewed', value: 'recent', comparator: (a, b) => {
    const timeA = a.last_opened_at ? new Date(a.last_opened_at).getTime() : 0;
    const timeB = b.last_opened_at ? new Date(b.last_opened_at).getTime() : 0;
    // We want descending order for "Recent"
    return timeB - timeA;
  }},
];

function AllPagesList() {
  const { pages, loading, refetch } = useAllPages();
  const openComicPage = useOpenComicPage();

  return (
    <GridPage
      type="pages"
      title="All Pages"
      icon={<RxImage size={24} />}
      items={pages}
      loading={loading}
      renderItem={(page) => (
        <PageCard 
          key={page.id} 
          page={page} 
          onOpen={openComicPage} 
          onUpdate={refetch} 
        />
      )}
      searchFields={(page) => [page.comic_title, page.comic_artist, page.file_path]}
      sortOptions={sortOptions}
      defaultSortKey="recent"
      defaultSortOrder="desc"
      showFavoriteFilter
      showViewFilter
      isFavorite={(p) => p.is_favorite === 1}
      isViewed={(p) => p.last_opened_at !== null}
      noItemsMessage="No pages found. Start indexing comics to see them here."
      itemHeight={450}
    />
  );
}