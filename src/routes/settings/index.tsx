import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useIndexing } from '../../contexts/indexing-context';
import { useIndexPaths } from '../../hooks/use-index-paths';
import * as indexPathService from '../../services/index-path-service';
import { RxSymbol, RxReload, RxCheck, RxExclamationTriangle, RxPlus, RxTrash } from 'react-icons/rx';

export const Route = createFileRoute('/settings/')({
  component: SettingsPage,
});

function SettingsPage() {
  const { isIndexing, progress, startIndexing, lastIndexedAt } = useIndexing();
  const { indexPaths, loading: loadingPaths, refresh: refreshPaths } = useIndexPaths();
  const [newPath, setNewPath] = useState('');

  const handleAddPath = async () => {
    if (!newPath.trim()) return;
    try {
      await indexPathService.addIndexPath(newPath.trim(), '{artist}/{series}/{issue}');
      setNewPath('');
      await refreshPaths();
      // Also potentially trigger indexing for the new path
      startIndexing();
    } catch (error) {
      console.error('Failed to add path:', error);
    }
  };

  const handleRemovePath = async (id: number) => {
    try {
      await indexPathService.removeIndexPath(id);
      await refreshPaths();
    } catch (error) {
      console.error('Failed to remove path:', error);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-auto p-8 max-w-4xl mx-auto gap-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Comic Library</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage your comic collection and indexing.</p>
          </div>
          <button
            onClick={startIndexing}
            disabled={isIndexing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isIndexing 
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-95'
            }`}
          >
            {isIndexing ? (
              <RxSymbol className="animate-spin" />
            ) : (
              <RxReload />
            )}
            {isIndexing ? 'Indexing...' : 'Reindex All'}
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Indexed Paths</h3>
            {loadingPaths ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <RxSymbol className="animate-spin" />
                <span>Loading paths...</span>
              </div>
            ) : indexPaths.length === 0 ? (
              <div className="text-sm text-muted-foreground bg-muted/20 border border-dashed border-border p-4 rounded-lg flex items-center gap-3">
                <RxExclamationTriangle className="text-amber-500" />
                <span>No library paths configured. Add one below to start indexing.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {indexPaths.map((ip) => (
                  <div key={ip.id} className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border group">
                    <span className="text-sm truncate font-mono">{ip.path}</span>
                    <button 
                      onClick={() => handleRemovePath(ip.id)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1"
                      title="Remove path"
                    >
                      <RxTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Add New Path</h3>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="C:/comics or /home/user/comics"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <button 
                onClick={handleAddPath}
                disabled={!newPath.trim()}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RxPlus />
                Add
              </button>
            </div>
          </div>

          {isIndexing && progress && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border/50">
              <div className="flex justify-between text-sm font-medium">
                <span className="flex items-center gap-2">
                  <RxSymbol className="animate-spin text-primary" />
                  {progress.status === 'scanning' ? (
                    <span>Scanning Path {progress.currentPathIndex} of {progress.totalPaths}</span>
                  ) : progress.status === 'cleanup' ? (
                    <span>Cleaning up...</span>
                  ) : (
                    <span>Indexing Path {progress.currentPathIndex} of {progress.totalPaths}</span>
                  )}
                </span>
                {progress.status === 'indexing' && progress.current !== undefined && progress.total !== undefined && (
                  <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                )}
              </div>
              
              <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border/50">
                <div 
                  className={`h-full transition-all duration-300 ease-out ${
                    progress.status === 'scanning' ? 'bg-amber-400 animate-pulse w-full' : 
                    progress.status === 'cleanup' ? 'bg-blue-400 w-full' : 'bg-primary'
                  }`}
                  style={progress.status === 'indexing' && progress.current !== undefined && progress.total !== undefined ? { 
                    width: `${(progress.current / progress.total) * 100}%` 
                  } : {}}
                />
              </div>
              
              {progress.currentPath && (
                <div className="text-[10px] text-muted-foreground truncate font-mono bg-background/50 p-1 rounded">
                  {progress.currentPath}
                </div>
              )}
              
              {progress.status === 'indexing' && progress.current !== undefined && progress.total !== undefined && (
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>Comic {progress.current} of {progress.total}</span>
                </div>
              )}
            </div>
          )}

          {!isIndexing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
              {lastIndexedAt ? (
                <>
                  <RxCheck className="text-green-500" />
                  <span>Last indexed: {new Date(lastIndexedAt).toLocaleString()}</span>
                </>
              ) : (
                <>
                  <RxExclamationTriangle className="text-amber-500" />
                  <span>Not indexed yet. Click "Reindex All" to scan your library.</span>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6 shadow-sm opacity-50">
        <h2 className="text-xl font-semibold mb-4">Appearance</h2>
        <p className="text-sm text-muted-foreground">Theme and layout settings (planned).</p>
      </section>

      <section className="bg-card border border-border rounded-xl p-6 shadow-sm opacity-50">
        <h2 className="text-xl font-semibold mb-4">Advanced</h2>
        <p className="text-sm text-muted-foreground">Cache management and performance (planned).</p>
      </section>
    </div>
  );
}
