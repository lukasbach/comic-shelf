import React, { useState, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useComics } from '../../hooks/use-comics';
import { useIndexPaths } from '../../hooks/use-index-paths';
import { useOpenComic } from '../../hooks/use-open-comic';
import { RxSymbol, RxHome, RxChevronRight } from 'react-icons/rx';
import { LibraryGrid } from '../../components/library-grid';
import { ComicCard } from '../../components/comic-card';
import { FolderCard } from '../../components/folder-card';
import { normalizePath, naturalSortComparator } from '../../utils/image-utils';
import type { Comic } from '../../types/comic';

export const Route = createFileRoute('/library/')({
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
  const { comics, loading: loadingComics } = useComics();
  const { indexPaths, loading: loadingPaths } = useIndexPaths();
  const openComic = useOpenComic();
  const [currentPath, setCurrentPath] = useState<string>('');

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

  const breadcrumbs = useMemo(() => {
    if (!currentPath) return [];
    
    const root = indexPaths.find(ip => {
        const normIp = normalizePath(ip.path);
        const normCurr = normalizePath(currentPath);
        return normCurr === normIp || normCurr.startsWith(normIp + '/');
    });
    
    if (!root) return [{ name: currentPath, path: normalizePath(currentPath) }];

    const normRoot = normalizePath(root.path);
    const normCurrent = normalizePath(currentPath);
    
    if (normRoot === normCurrent) {
        return [{ name: root.path, path: normRoot }];
    }

    const relative = normCurrent.slice(normRoot.length).replace(/^\//, '');
    const segments = relative.split('/');
    
    const crumbs = [{ name: root.path, path: normRoot }];
    let currentBuild = normRoot;
    
    for (const segment of segments) {
      currentBuild = currentBuild.endsWith('/') ? currentBuild + segment : currentBuild + '/' + segment;
      crumbs.push({ name: segment, path: currentBuild });
    }
    
    return crumbs;
  }, [currentPath, indexPaths]);

  if (loadingComics || loadingPaths) {
    return (
      <div className="flex items-center justify-center h-full">
        <RxSymbol className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (indexPaths.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 text-center">
        <p className="text-lg font-medium">No library paths configured.</p>
        <p className="text-sm">Add indexing paths in Settings to see your comics.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-border bg-card/50">
        <button 
          onClick={() => setCurrentPath('')}
          className="p-1 px-2 hover:bg-muted rounded flex items-center gap-1 text-sm font-medium transition-colors"
        >
          <RxHome size={16} />
          <span>Library</span>
        </button>
        
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb.path}>
            <RxChevronRight className="text-muted-foreground" />
            <button 
              onClick={() => setCurrentPath(crumb.path)}
              className={`p-1 px-2 hover:bg-muted rounded text-sm transition-colors truncate max-w-50 ${
                i === breadcrumbs.length - 1 ? 'font-bold' : 'font-medium'
              }`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {currentItems.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No items found.
          </div>
        ) : (
          <LibraryGrid>
            {currentItems.map((item) => (
              item.type === 'folder' ? (
                <FolderCard 
                  key={item.path}
                  name={item.name}
                  path={item.path}
                  thumbnailPath={item.thumbnail_path}
                  comicCount={item.comic_count}
                  onClick={setCurrentPath}
                />
              ) : (
                <ComicCard 
                  key={item.id}
                  comic={item}
                  onOpen={openComic}
                />
              )
            ))}
          </LibraryGrid>
        )}
      </div>
    </div>
  );
}
