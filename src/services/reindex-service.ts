import { getAllIndexPaths } from './index-path-service';
import { indexComics, IndexingProgress } from './indexing-service';

export type GlobalIndexingProgress = IndexingProgress & {
  currentPathIndex: number;
  totalPaths: number;
};

/**
 * Re-indexes all configured library paths.
 */
export const reindexAll = async (
  onProgress?: (progress: GlobalIndexingProgress) => void
): Promise<void> => {
  const paths = await getAllIndexPaths();
  const totalPaths = paths.length;

  for (let i = 0; i < totalPaths; i++) {
    const path = paths[i];
    await indexComics(path.path, path.pattern, (p) => {
      onProgress?.({
        ...p,
        currentPathIndex: i + 1,
        totalPaths,
      });
    });
  }
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
