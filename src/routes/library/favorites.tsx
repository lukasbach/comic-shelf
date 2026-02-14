import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { VirtualizedGrid } from '../../components/virtualized-grid';
import { ComicCard } from '../../components/comic-card';
import { FavoriteImageCard } from '../../components/favorite-image-card';
import { useFavoriteComics } from '../../hooks/use-favorite-comics';
import { useFavoritePages } from '../../hooks/use-favorite-pages';
import { useOpenComic } from '../../hooks/use-open-comic';
import { useOpenComicPage } from '../../hooks/use-open-comic-page';
import { RxSymbol, RxStarFilled, RxGrid, RxFile } from 'react-icons/rx';
import { Tabs } from '../../components/tabs';

export const Route = createFileRoute('/library/favorites')({
  component: LibraryFavorites,
});

function LibraryFavorites() {
  const { comics: favoriteComics, loading: loadingComics } = useFavoriteComics();
  const { pages: favoritePages, loading: loadingPages } = useFavoritePages();
  const openComic = useOpenComic();
  const openComicPage = useOpenComicPage();

  const [activeTab, setActiveTab] = useState('comics');

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
      if (favoriteComics.length === 0 && favoritePages.length > 0) {
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
    <div className="flex flex-col h-full gap-6 p-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Favorites</h1>
      </div>

      <Tabs 
        items={tabItems} 
        activeId={activeTab} 
        onChange={(id) => setActiveTab(id)} 
      />

      <div className="flex-1 overflow-hidden">
        {activeTab === 'comics' ? (
          <div className="h-full">
            {favoriteComics.length > 0 ? (
              <VirtualizedGrid
                items={favoriteComics}
                renderItem={(comic) => (
                  <ComicCard key={comic.id} comic={comic} onOpen={openComic} />
                )}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>No favorite comics yet.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full">
            {favoritePages.length > 0 ? (
              <VirtualizedGrid
                items={favoritePages}
                renderItem={(page) => (
                  <FavoriteImageCard 
                    key={page.id} 
                    page={page} 
                    onOpen={openComicPage} 
                  />
                )}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>No favorite pages yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
