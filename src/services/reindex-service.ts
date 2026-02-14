import { getAllIndexPaths } from './index-path-service';
import { indexComics, IndexingError, IndexingProgress } from './indexing-service';
import * as comicService from './comic-service';
import * as thumbnailService from './thumbnail-service';
import { isSubPath } from '../utils/image-utils';

export type GlobalIndexingProgress = {
  status: 'scanning' | 'indexing' | 'cleanup';
  currentPathIndex: number;
  totalPaths: number;
  current?: number;
  total?: number;
  currentPath?: string;
  errors: IndexingError[];
};

/**
 * Re-indexes all configured library paths.
 */
export const reindexAll = async (
  onProgress?: (progress: GlobalIndexingProgress) => void
): Promise<void> => {
  const paths = await getAllIndexPaths();
  const totalPaths = paths.length;
  const allErrors: IndexingError[] = [];

  if (totalPaths === 0) return;

  for (let i = 0; i < totalPaths; i++) {
    const path = paths[i];
    onProgress?.({
      status: 'scanning',
      currentPathIndex: i + 1,
      totalPaths,
      currentPath: path.path,
      errors: [...allErrors],
    });

    await indexComics(path.path, path.pattern, (p) => {
      // Accumulate new errors from this path
      const newErrors = p.errors.filter(e => !allErrors.some(ae => ae.path === e.path));
      if (newErrors.length > 0) {
        allErrors.push(...newErrors);
      }
      
      onProgress?.({
        ...p,
        status: 'indexing',
        currentPathIndex: i + 1,
        totalPaths,
        errors: [...allErrors],
      });
    });
  }

  // Final cleanup for orphaned comics (belonging to index paths no longer configured)
  const allDbComics = await comicService.getAllComics();
  for (const dbComic of allDbComics) {
    const belongsToAnyPath = paths.some((p) => isSubPath(p.path, dbComic.path));
    if (!belongsToAnyPath) {
      await comicService.deleteComic(dbComic.id);
      await thumbnailService.deleteThumbnailsForComic(dbComic.id);
    }
  }

  onProgress?.({
    status: 'cleanup',
    currentPathIndex: totalPaths,
    totalPaths,
    errors: [...allErrors],
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
