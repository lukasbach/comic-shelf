import { getDb } from './database';
import type { IndexPath } from '../types/comic';

export const getAllIndexPaths = async (): Promise<IndexPath[]> => {
  const db = await getDb();
  return await db.select<IndexPath[]>('SELECT * FROM index_paths ORDER BY created_at DESC');
};

export const addIndexPath = async (path: string, pattern: string): Promise<number> => {
  const db = await getDb();
  const result = await db.execute(
    'INSERT INTO index_paths (path, pattern) VALUES ($1, $2)',
    [path, pattern]
  );
  return result.lastInsertId ?? 0;
};

export const removeIndexPath = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute('DELETE FROM index_paths WHERE id = $1', [id]);
};
