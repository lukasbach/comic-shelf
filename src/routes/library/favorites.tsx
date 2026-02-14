import { createFileRoute } from '@tanstack/react-router';
import { ComicGrid } from '../../components/comic-grid';
import { FavoriteImageCard } from '../../components/favorite-image-card';
import { useFavoriteComics } from '../../hooks/use-favorite-comics';
import { useFavoritePages } from '../../hooks/use-favorite-pages';
import { useOpenComic } from '../../hooks/use-open-comic';
import { useOpenComicPage } from '../../hooks/use-open-comic-page';
import { RxSymbol, RxStarFilled } from 'react-icons/rx';

export const Route = createFileRoute('/library/favorites')({
  component: LibraryFavorites,
});

function LibraryFavorites() {
  const { comics: favoriteComics, loading: loadingComics } = useFavoriteComics();
  const { pages: favoritePages, loading: loadingPages } = useFavoritePages();
  const openComic = useOpenComic();
  const openComicPage = useOpenComicPage();

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
        <p className="text-sm">Star comics or images to see them here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-8 p-6 overflow-auto">
      <h1 className="text-2xl font-bold">Favorites</h1>

      {favoriteComics.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Favorite Comics
            <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {favoriteComics.length}
            </span>
          </h2>
          <ComicGrid comics={favoriteComics} onOpenComic={openComic} />
        </section>
      )}

      {favoritePages.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Favorite Images
            <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {favoritePages.length}
            </span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {favoritePages.map((page) => (
              <FavoriteImageCard 
                key={page.id} 
                page={page} 
                onOpen={openComicPage} 
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
