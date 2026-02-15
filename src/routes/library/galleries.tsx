import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useGalleries } from '../../hooks/use-galleries';
import { GalleryCard } from '../../components/gallery-card';
import { VirtualizedGrid } from '../../components/virtualized-grid';
import { useSettings } from '../../contexts/settings-context';
import { RxSymbol, RxPlus, RxMagnifyingGlass, RxArrowDown, RxArrowUp, RxLayers } from 'react-icons/rx';
import * as galleryService from '../../services/gallery-service';

type SortKey = 'name' | 'date' | 'count';

interface GalleriesSearchParams {
  search?: string;
  sort?: SortKey;
  order?: 'asc' | 'desc';
}

export const Route = createFileRoute('/library/galleries')({
  validateSearch: (search: Record<string, unknown>): GalleriesSearchParams => {
    return {
      search: (search.search as string) || undefined,
      sort: (search.sort as SortKey) || 'name',
      order: (search.order as 'asc' | 'desc') || 'asc',
    }
  },
  component: GalleriesPage,
});

function GalleriesPage() {
  const { search: searchQuery = '', sort: sortKey, order: sortOrder } = Route.useSearch();
  const navigate = useNavigate();
  const { galleries, loading, refresh } = useGalleries();
  const { settings } = useSettings();
  const [isCreating, setIsCreating] = useState(false);

  const setParams = (updates: Partial<GalleriesSearchParams>) => {
    navigate({
      to: '/library/galleries',
      search: (prev: any) => ({ ...prev, ...updates }),
      replace: true,
    });
  };

  const setSearchQuery = (q: string) => setParams({ search: q || undefined });
  const setSortKey = (k: SortKey) => setParams({ sort: k });
  const toggleOrder = () => setParams({ order: sortOrder === 'asc' ? 'desc' : 'asc' });

  const filteredAndSortedGalleries = useMemo(() => {
    let result = [...galleries];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g => g.name.toLowerCase().includes(q));
    }

    // Sort
    return result.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'count':
          comparison = (a.page_count || 0) - (b.page_count || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [galleries, searchQuery, sortKey, sortOrder]);

  const handleCreateGallery = async () => {
    const name = prompt('Enter gallery name:');
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
    const name = prompt('Enter new gallery name:', currentName);
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
    if (confirm(`Are you sure you want to delete the gallery "${name}"? This will not delete the comic pages themselves.`)) {
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
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 text-slate-400 p-8 text-center">
        <RxLayers size={64} className="mb-4 opacity-20" />
        <h2 className="text-xl font-bold text-slate-200">Galleries Disabled</h2>
        <p className="max-w-md mt-2">The Galleries feature is currently disabled in settings. Enable it to create and manage custom collections of pages.</p>
        <Link to="/settings" className="mt-6 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-medium transition-colors">
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 border-b border-slate-900 bg-slate-950/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <RxLayers className="text-pink-500" />
            Galleries
            <span className="text-xs font-normal text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full ml-1">
              {filteredAndSortedGalleries.length}
            </span>
          </h1>

          <div className="h-6 w-px bg-slate-800 hidden md:block" />

          <div className="relative group">
            <RxMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-400 transition-colors" />
            <input
              type="text"
              placeholder="Search galleries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500/50 focus:border-pink-500/50 w-full md:w-64 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            {[
              { key: 'name', label: 'Name' },
              { key: 'date', label: 'Date' },
              { key: 'count', label: 'Pages' },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setSortKey(s.key as SortKey)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                  sortKey === s.key ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={toggleOrder}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-pink-400 transition-colors"
            title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
          >
            {sortOrder === 'asc' ? <RxArrowUp /> : <RxArrowDown />}
          </button>

          <button
            onClick={handleCreateGallery}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-pink-900/20"
          >
            <RxPlus /> New Gallery
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RxSymbol className="animate-spin text-pink-500" size={32} />
          </div>
        ) : filteredAndSortedGalleries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <RxLayers size={48} className="mb-4 opacity-20" />
            <p className="text-lg">No galleries found</p>
            {searchQuery && <p className="text-sm">Try adjusting your search</p>}
          </div>
        ) : (
          <VirtualizedGrid
            items={filteredAndSortedGalleries}
            renderItem={(g) => (
              <GalleryCard
                gallery={g}
                onClick={() => navigate({ to: `/viewer/gallery-${g.id}` as any })}
                onDelete={() => handleDeleteGallery(g.id, g.name)}
                onRename={() => handleRenameGallery(g.id, g.name)}
              />
            )}
          />
        )}
      </div>
    </div>
  );
}
