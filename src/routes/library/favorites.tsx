import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { GridPage, SortOption } from '../../components/grid-page';
import { ComicCard } from '../../components/comic-card';
import { PageCard } from '../../components/page-card';
import { GalleryCard } from '../../components/gallery-card';
import { useFavoriteComics } from '../../hooks/use-favorite-comics';
import { useFavoritePages } from '../../hooks/use-favorite-pages';
import { useFavoriteGalleries } from '../../hooks/use-favorite-galleries';
import { useOpenComic } from '../../hooks/use-open-comic';
import { useOpenComicPage } from '../../hooks/use-open-comic-page';
import { useSettings } from '../../contexts/settings-context';
import { RxStarFilled, RxGrid, RxFile, RxLayers } from 'react-icons/rx';
import { Tabs } from '../../components/tabs';
import { Comic } from '../../types/comic';
import { Gallery } from '../../types/gallery';
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

const gallerySortOptions: SortOption<Gallery>[] = [
  { label: 'Name', value: 'name', comparator: (a, b) => a.name.localeCompare(b.name) },
  { label: 'Date Added', value: 'date', comparator: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() },
  { label: 'Pages', value: 'count', comparator: (a, b) => (a.page_count || 0) - (b.page_count || 0) },
];

function LibraryFavorites() {
  const { tab: activeTab } = Route.useSearch();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { comics: favoriteComics, loading: loadingComics } = useFavoriteComics();
  const { pages: favoritePages, loading: loadingPages, refresh: refreshPages } = useFavoritePages();
  const { galleries: favoriteGalleries, loading: loadingGalleries, refresh: refreshGalleries } = useFavoriteGalleries();
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
    ...(settings.enableGalleries ? [{
      id: 'galleries',
      label: `Galleries (${favoriteGalleries.length})`,
      icon: <RxLayers size={18} />,
    }] : []),
  ];

  const loading = loadingComics || loadingPages || loadingGalleries;

  const renderItem = (item: any) => {
    if (activeTab === 'comics') {
      return <ComicCard key={item.id} comic={item} onOpen={openComic} />;
    }
    if (activeTab === 'pages') {
      return <PageCard key={item.id} page={item} onOpen={openComicPage} onUpdate={refreshPages} />;
    }
    if (activeTab === 'galleries') {
      return (
        <GalleryCard 
          key={item.id} 
          gallery={item} 
          onClick={() => navigate({ to: `/viewer/gallery-${item.id}` as any })}
          onUpdate={refreshGalleries}
        />
      );
    }
    return null;
  };

  const getItems = () => {
    if (activeTab === 'comics') return favoriteComics;
    if (activeTab === 'pages') return favoritePages;
    if (activeTab === 'galleries') return favoriteGalleries;
    return [];
  };

  const getSearchFields = (item: any): string[] => {
    if (activeTab === 'comics') return [item.title, item.artist, item.path];
    if (activeTab === 'pages') return [item.comic_title, item.comic_artist, item.file_path];
    if (activeTab === 'galleries') return [item.name];
    return [];
  };

  const getSortOptions = () => {
    if (activeTab === 'comics') return comicSortOptions;
    if (activeTab === 'pages') return pageSortOptions;
    if (activeTab === 'galleries') return gallerySortOptions;
    return [];
  };

  const getDefaultSortKey = () => {
    if (activeTab === 'comics') return 'title';
    if (activeTab === 'pages') return 'comic_title';
    if (activeTab === 'galleries') return 'name';
    return '';
  };

  const getEmptyMessage = () => {
    if (activeTab === 'comics') return "No favorite comics yet.";
    if (activeTab === 'pages') return "No favorite pages yet.";
    if (activeTab === 'galleries') return "No favorite galleries yet.";
    return "";
  };

  return (
    <GridPage<any>
      type={activeTab as any}
      title="Favorites"
      icon={<RxStarFilled size={24} className="text-amber-400" />}
      items={getItems()}
      loading={loading}
      renderItem={renderItem}
      actions={
        <div className="flex items-center bg-muted/30 p-1 rounded-lg border border-border/50">
          <Tabs 
            items={tabItems} 
            activeId={activeTab} 
            onChange={(id) => setActiveTab(id)} 
          />
        </div>
      }
      searchFields={getSearchFields}
      sortOptions={getSortOptions()}
      defaultSortKey={getDefaultSortKey()}
      showViewFilter
      isViewed={(item) => !!item.last_opened_at}
      emptyMessage={getEmptyMessage()}
      noItemsMessage={getEmptyMessage()}
    />
  );
}
