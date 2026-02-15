import { useMemo } from 'react';
import { useNavigate, createFileRoute } from '@tanstack/react-router';
import { useComics } from '../../hooks/use-comics';
import { useIndexPaths } from '../../hooks/use-index-paths';
import { useIndexing } from '../../contexts/indexing-context';
import { useOpenComic } from '../../hooks/use-open-comic';
import { useTabs } from '../../contexts/tab-context';
import { RxSymbol, RxPlus, RxArchive } from 'react-icons/rx';
import { GridView } from '../../components/grid-view';
import { ComicCard } from '../../components/comic-card';
import { FolderCard } from '../../components/folder-card';
import { normalizePath, naturalSortComparator } from '../../utils/image-utils';
import * as indexPathService from '../../services/index-path-service';
import { open } from '@tauri-apps/plugin-dialog';
import type { Comic } from '../../types/comic';

export const Route = createFileRoute('/library/')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      path: (search.path as string) || '',
    }
  },
  component: LibraryExplorer,
});

type ExplorerFolder = {
  type: 'folder';
  name: string;
  path: string;
  thumbnail_path?: string;
  comic_count: number;
};

type ExplorerItem = (Comic & { type: 'comic' }) | ExplorerFolder;

function LibraryExplorer() {
  const { path: currentPath = '' } = Route.useSearch();
  const navigate = useNavigate();
  const { comics, loading: loadingComics } = useComics();
  const { indexPaths, loading: loadingPaths, refresh: refreshPaths } = useIndexPaths();
  const { startIndexing } = useIndexing();
  const openComic = useOpenComic();
  const { openLibraryTab } = useTabs();

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Comic Library Folder'
      });
      
      if (selected && typeof selected === 'string') {
        await indexPathService.addIndexPath(selected, '{author}/{series}');
        await refreshPaths();
        // Trigger indexing for new path
        startIndexing();
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const setCurrentPath = (path: string) => {
    navigate({
      to: '/library',
      search: { path } as any,
    });
  };

  const handleFolderClick = (path: string, e?: React.MouseEvent) => {
    const isNewTab = e ? (e.ctrlKey || e.metaKey || (e as any).button === 1) : false;
    
    if (isNewTab) {
      const title = path.split(/[\\/]/).pop() || path;
      openLibraryTab(`/library?path=${encodeURIComponent(path)}`, title, true);
    } else {
      setCurrentPath(path);
    }
  };

  const currentItems = useMemo(() => {
    if (loadingComics || loadingPaths) return [];
    
    const normCurrentPath = normalizePath(currentPath);
    
    // If at root, show index paths as folders
    if (!currentPath) {
      return indexPaths.map(ip => {
        const normIpPath = normalizePath(ip.path);
        const nestedComics = comics.filter(c => normalizePath(c.path).startsWith(normIpPath));
        return {
          type: 'folder' as const,
          name: ip.path,
          path: normIpPath,
          thumbnail_path: nestedComics[0]?.thumbnail_path || undefined,
          comic_count: nestedComics.length
        };
      });
    }

    // At a specific path
    const items: ExplorerItem[] = [];
    const foldersMap = new Map<string, { thumbnail?: string, count: number }>();

    for (const comic of comics) {
      const normComicPath = normalizePath(comic.path);
      
      if (normComicPath.startsWith(normCurrentPath)) {
        if (normComicPath === normCurrentPath) {
          // This case might happen if multiple comics share the exact same folder 
          // (which shouldn't happen based on indexer logic, but safety first)
          items.push({ ...comic, type: 'comic' });
          continue;
        }

        const relative = normComicPath.slice(normCurrentPath.length).replace(/^\//, '');
        const segments = relative.split('/');
        
        if (segments.length === 1) {
          // It's a comic directly in this folder
          items.push({ ...comic, type: 'comic' });
        } else {
          // It's in a subfolder
          const folderName = segments[0];
          const folderData = foldersMap.get(folderName) || { count: 0 };
          folderData.count++;
          if (!folderData.thumbnail) {
            folderData.thumbnail = comic.thumbnail_path || undefined;
          }
          foldersMap.set(folderName, folderData);
        }
      }
    }

    const folders: ExplorerFolder[] = Array.from(foldersMap.entries()).map(([name, data]) => ({
      type: 'folder' as const,
      name,
      path: normCurrentPath.endsWith('/') ? normCurrentPath + name : normCurrentPath + '/' + name,
      thumbnail_path: data.thumbnail,
      comic_count: data.count
    }));

    return [...folders, ...items].sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
        }
        const nameA = a.type === 'folder' ? a.name : a.title;
        const nameB = b.type === 'folder' ? b.name : b.title;
        return naturalSortComparator(nameA, nameB);
    });
  }, [currentPath, comics, indexPaths, loadingComics, loadingPaths]);

  if (loadingComics || loadingPaths) {
    return (
      <div className="flex items-center justify-center h-full">
        <RxSymbol className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (indexPaths.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-6 text-center p-8">
        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
          <RxArchive size={40} />
        </div>
        <div className="space-y-2">
          <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">Your library is empty</p>
          <p className="text-sm max-w-xs mx-auto">Add a folder containing your comics to start building your library.</p>
        </div>
        <button
          onClick={handleSelectFolder}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95 cursor-pointer"
        >
          <RxPlus size={20} />
          <span>Add Comic Folder</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-hidden">
        {currentItems.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground p-6">
            No items found.
          </div>
        ) : (
          <GridView
            items={currentItems}
            renderItem={(item) => (
              item.type === 'folder' ? (
                <FolderCard 
                  key={item.path}
                  name={item.name}
                  path={item.path}
                  thumbnailPath={item.thumbnail_path}
                  comicCount={item.comic_count}
                  onClick={handleFolderClick}
                />
              ) : (
                <ComicCard 
                  key={item.id}
                  comic={item}
                  onOpen={openComic}
                />
              )
            )}
          />
        )}
      </div>
    </div>
  );
}
