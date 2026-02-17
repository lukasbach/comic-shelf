import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { NavigationLink } from '../../components/navigation-link';
import { GridPage, SortOption } from '../../components/grid-page';
import { GalleryCard } from '../../components/gallery-card';
import { useGalleries } from '../../hooks/use-galleries';
import { useSettings } from '../../contexts/settings-context';
import { RxPlus, RxLayers } from 'react-icons/rx';
import * as galleryService from '../../services/gallery-service';
import { Gallery } from '../../types/gallery';

export const Route = createFileRoute('/library/galleries')({
  component: GalleriesPage,
});

const sortOptions: SortOption<Gallery>[] = [
  { label: 'Name', value: 'name', comparator: (a, b) => a.name.localeCompare(b.name) },
  { label: 'Date', value: 'date', comparator: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() },
  { label: 'Pages', value: 'count', comparator: (a, b) => (a.page_count || 0) - (b.page_count || 0) },
];

function GalleriesPage() {
  const navigate = useNavigate();
  const { galleries, loading, refresh } = useGalleries();
  const { settings } = useSettings();

  const handleCreateGallery = async () => {
    const name = window.prompt('Enter gallery name:');
    if (name) {
      try {
        await galleryService.createGallery(name);
        refresh();
      } catch (err) {
        alert('Failed to create gallery. Name might already exist.');
      }
    }
  };

  const handleRenameGallery = async (id: number, currentName: string) => {
    const name = window.prompt('Enter new gallery name:', currentName);
    if (name && name !== currentName) {
      try {
        await galleryService.updateGalleryName(id, name);
        refresh();
      } catch (err) {
        alert('Failed to rename gallery.');
      }
    }
  };

  const handleDeleteGallery = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete the gallery "${name}"? This will not delete the comic pages themselves.`)) {
      try {
        await galleryService.deleteGallery(id);
        refresh();
      } catch (err) {
        alert('Failed to delete gallery.');
      }
    }
  };

  if (!settings.enableGalleries) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
        <RxLayers size={64} className="mb-4 opacity-20" />
        <h2 className="text-xl font-bold text-slate-200">Galleries Disabled</h2>
        <p className="max-w-md mt-2">The Galleries feature is currently disabled in settings. Enable it to create and manage custom collections of pages.</p>
        <NavigationLink to="/settings" title="Settings" className="mt-6 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-medium transition-colors">
          Go to Settings
        </NavigationLink>
      </div>
    );
  }

  return (
    <GridPage
      type="galleries"
      title="Galleries"
      icon={<RxLayers className="text-pink-500" size={24} />}
      items={galleries}
      loading={loading}
      onActivateItem={(g) => navigate({ to: `/viewer/gallery-${g.id}` as any })}
      renderItem={(g, _, isFocused) => (
        <GalleryCard
          key={g.id}
          gallery={g}
          onClick={() => navigate({ to: `/viewer/gallery-${g.id}` as any })}
          onDelete={() => handleDeleteGallery(g.id, g.name)}
          onRename={() => handleRenameGallery(g.id, g.name)}
          onUpdate={refresh}
          isFocused={isFocused}
        />
      )}
      searchFields={(g) => [g.name]}
      sortOptions={sortOptions}
      defaultSortKey="name"
      actions={
        <button
          onClick={handleCreateGallery}
          className="flex items-center gap-2 px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-pink-900/20"
        >
          <RxPlus /> New Gallery
        </button>
      }
      noItemsMessage="No galleries found. Create one to start organizing your pages."
    />
  );
}
