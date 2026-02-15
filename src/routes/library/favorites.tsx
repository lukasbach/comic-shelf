import { useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { GridView } from '../../components/grid-view';
import { ComicCard } from '../../components/comic-card';
import { PageCard } from '../../components/page-card';
import { useFavoriteComics } from '../../hooks/use-favorite-comics';
import { useFavoritePages } from '../../hooks/use-favorite-pages';
import { useOpenComic } from '../../hooks/use-open-comic';
import { useOpenComicPage } from '../../hooks/use-open-comic-page';
import { RxSymbol, RxStarFilled, RxGrid, RxFile } from 'react-icons/rx';
import { Tabs } from '../../components/tabs';

export const Route = createFileRoute('/library/favorites')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: (search.tab as string) || 'comics',
    }
  },
  component: LibraryFavorites,
});

function LibraryFavorites() {
  const { tab: activeTab } = Route.useSearch();
  const navigate = useNavigate();
  const { comics: favoriteComics, loading: loadingComics, refresh: refreshComics } = useFavoriteComics();
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
      label: 'Comics',
      count: favoriteComics.length,
      icon: <RxGrid size={18} />,
    },
    {
      id: 'pages',
      label: 'Pages',
      count: favoritePages.length,
      icon: <RxFile size={18} />,
    },
  ];

  useEffect(() => {
    if (!loadingComics && !loadingPages) {
      if (favoriteComics.length === 0 && favoritePages.length > 0 && activeTab === 'comics') {
        setActiveTab('pages');
      }
    }
  }, [loadingComics, loadingPages, favoriteComics.length, favoritePages.length]);

  const loading = loadingComics || loadingPages;
  const hasFavorites = favoriteComics.length > 0 || favoritePages.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RxSymbol className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (!hasFavorites) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 text-center">
        <RxStarFilled size={48} className="opacity-20" />
        <p className="text-lg font-medium">No favorites yet.</p>
        <p className="text-sm">Star comics or pages to see them here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-6 pb-4">
        <h1 className="text-2xl font-bold">Favorites</h1>
      </div>

      <div className="px-6 mb-2">
        <Tabs 
          items={tabItems} 
          activeId={activeTab} 
          onChange={(id) => setActiveTab(id)} 
        />
      </div>

      {activeTab === 'comics' ? (
        <GridView
          items={favoriteComics}
          renderItem={(comic) => (
            <ComicCard 
              key={comic.id} 
              comic={comic} 
              onOpen={openComic} 
              onUpdate={refreshComics}
            />
          )}
          emptyMessage="No favorite comics yet."
        />
      ) : (
        <GridView
          items={favoritePages}
          renderItem={(page) => (
            <PageCard 
              key={page.id} 
              page={page as any} 
              onOpen={openComicPage} 
              onUpdate={refreshPages}
            />
          )}
          emptyMessage="No favorite pages yet."
        />
      )}
    </div>
  );
}
