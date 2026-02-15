import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { GridPage, SortOption } from '../../components/grid-page';
import { ComicCard } from '../../components/comic-card';
import { PageCard } from '../../components/page-card';
import { useFavoriteComics } from '../../hooks/use-favorite-comics';
import { useFavoritePages } from '../../hooks/use-favorite-pages';
import { useOpenComic } from '../../hooks/use-open-comic';
import { useOpenComicPage } from '../../hooks/use-open-comic-page';
import { RxStarFilled, RxGrid, RxFile } from 'react-icons/rx';
import { Tabs } from '../../components/tabs';
import { Comic } from '../../types/comic';
import { AllPageItem } from '../../hooks/use-all-pages';
import { naturalSortComparator } from '../../utils/image-utils';

export const Route = createFileRoute('/library/favorites')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: (search.tab as string) || 'comics',
    }
  },
  component: LibraryFavorites,
});

const comicSortOptions: SortOption<Comic>[] = [
  { label: 'Title', value: 'title', comparator: (a, b) => naturalSortComparator(a.title, b.title) },
  { label: 'Artist', value: 'artist', comparator: (a, b) => naturalSortComparator(a.artist || '', b.artist || '') },
  { label: 'Date Added', value: 'date', comparator: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() },
];

const pageSortOptions: SortOption<AllPageItem>[] = [
  { label: 'Comic Title', value: 'comic_title', comparator: (a, b) => naturalSortComparator(a.comic_title, b.comic_title) },
  { label: 'Page Number', value: 'page', comparator: (a, b) => a.page_number - b.page_number },
  { label: 'Date Added', value: 'date', comparator: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() },
];

function LibraryFavorites() {
  const { tab: activeTab } = Route.useSearch();
  const navigate = useNavigate();
  const { comics: favoriteComics, loading: loadingComics } = useFavoriteComics();
  const { pages: favoritePages, loading: loadingPages, refresh: refreshPages } = useFavoritePages();
  const openComic = useOpenComic();
  const openComicPage = useOpenComicPage();

  const setActiveTab = (tab: string) => {
    navigate({
      to: '/library/favorites',
      search: (prev) => ({ ...prev, tab }),
      replace: true,
    });
  };

  const tabItems = [
    {
      id: 'comics',
      label: `Comics (${favoriteComics.length})`,
      icon: <RxGrid size={18} />,
    },
    {
      id: 'pages',
      label: `Pages (${favoritePages.length})`,
      icon: <RxFile size={18} />,
    },
  ];

  const loading = loadingComics || loadingPages;

  return (
    <GridPage<any>
      type={activeTab === 'comics' ? 'comics' : 'pages'}
      title="Favorites"
      icon={<RxStarFilled size={24} className="text-amber-400" />}
      items={activeTab === 'comics' ? favoriteComics : favoritePages}
      loading={loading}
      renderItem={(item) => activeTab === 'comics' ? (
        <ComicCard key={item.id} comic={item} onOpen={openComic} />
      ) : (
        <PageCard key={item.id} page={item} onOpen={openComicPage} onUpdate={refreshPages} />
      )}
      actions={
        <div className="flex items-center bg-muted/30 p-1 rounded-lg border border-border/50">
          <Tabs 
            items={tabItems} 
            activeId={activeTab} 
            onChange={(id) => setActiveTab(id)} 
          />
        </div>
      }
      searchFields={(item) => activeTab === 'comics' 
        ? [item.title, item.artist, item.path]
        : [item.comic_title, item.comic_artist, item.file_path]
      }
      sortOptions={activeTab === 'comics' ? comicSortOptions : pageSortOptions}
      defaultSortKey={activeTab === 'comics' ? 'title' : 'comic_title'}
      showViewFilter
      isViewed={(item) => item.is_viewed === 1}
      emptyMessage={activeTab === 'comics' ? "No favorite comics yet." : "No favorite pages yet."}
      noItemsMessage={activeTab === 'comics' ? "No favorite comics yet." : "No favorite pages yet."}
    />
  );
}
