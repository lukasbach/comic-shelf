import { getAllIndexPaths } from './index-path-service';
import { indexComics, IndexingProgress } from './indexing-service';

export type GlobalIndexingProgress = {
  status: 'scanning' | 'indexing' | 'cleanup';
  currentPathIndex: number;
  totalPaths: number;
  current?: number;
  total?: number;
  currentPath?: string;
};

/**
 * Re-indexes all configured library paths.
 */
export const reindexAll = async (
  onProgress?: (progress: GlobalIndexingProgress) => void
): Promise<void> => {
  const paths = await getAllIndexPaths();
  const totalPaths = paths.length;

  if (totalPaths === 0) return;

  for (let i = 0; i < totalPaths; i++) {
    const path = paths[i];
    onProgress?.({
      status: 'scanning',
      currentPathIndex: i + 1,
      totalPaths,
      currentPath: path.path
    });

    await indexComics(path.path, path.pattern, (p) => {
      onProgress?.({
        ...p,
        status: 'indexing',
        currentPathIndex: i + 1,
        totalPaths,
      });
    });
  }

  onProgress?.({
    status: 'cleanup',
    currentPathIndex: totalPaths,
    totalPaths
  });
};

/**
 * Re-indexes a single path by its ID.
 */
export const reindexPathById = async (
  id: number,
  onProgress?: (progress: IndexingProgress) => void
): Promise<void> => {
  const paths = await getAllIndexPaths();
  const path = paths.find((p) => p.id === id);
  if (!path) throw new Error(`Index path with ID ${id} not found`);

  await indexComics(path.path, path.pattern, onProgress);
};
