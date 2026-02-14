import { createFileRoute } from '@tanstack/react-router';
import { FileTree } from '../../components/file-tree';
import { useComics } from '../../hooks/use-comics';
import { useIndexPaths } from '../../hooks/use-index-paths';
import { useOpenComic } from '../../hooks/use-open-comic';
import { RxSymbol } from 'react-icons/rx';

export const Route = createFileRoute('/library/')({
  component: LibraryExplorer,
});

function LibraryExplorer() {
  const { comics, loading: loadingComics } = useComics();
  const { indexPaths, loading: loadingPaths } = useIndexPaths();
  const openComic = useOpenComic();

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
    <div className="flex flex-col h-full gap-4 p-6 overflow-hidden">
      <h1 className="text-2xl font-bold">Explorer</h1>
      <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden flex flex-col shadow-sm">
        <div className="flex-1 overflow-auto p-2">
            <FileTree 
                comics={comics} 
                indexPaths={indexPaths} 
                onOpenComic={openComic} 
            />
        </div>
      </div>
    </div>
  );
}
