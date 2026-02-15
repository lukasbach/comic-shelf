import { getDb } from './database';
import type { Comic } from '../types/comic';

export const getAllComics = async (): Promise<Comic[]> => {
  const db = await getDb();
  return await db.select<Comic[]>(`
    SELECT c.*, p.thumbnail_path 
    FROM comics c 
    LEFT JOIN comic_pages p ON c.id = p.comic_id AND p.page_number = 1
    ORDER BY c.title ASC
  `);
};

export const getComicById = async (id: number): Promise<Comic | null> => {
  const db = await getDb();
  const results = await db.select<Comic[]>(`
    SELECT c.*, p.thumbnail_path 
    FROM comics c 
    LEFT JOIN comic_pages p ON c.id = p.comic_id AND p.page_number = 1
    WHERE c.id = $1
  `, [id]);
  return results.length > 0 ? results[0] : null;
};

export const getComicsByArtist = async (artist: string): Promise<Comic[]> => {
  const db = await getDb();
  return await db.select<Comic[]>(`
    SELECT c.*, p.thumbnail_path 
    FROM comics c 
    LEFT JOIN comic_pages p ON c.id = p.comic_id AND p.page_number = 1
    WHERE c.artist = $1 
    ORDER BY c.series ASC, c.issue ASC
  `, [artist]);
};

export const upsertComic = async (comic: Omit<Comic, 'id' | 'created_at' | 'updated_at' | 'is_viewed' | 'last_opened_at' | 'bookmark_page' | 'is_favorite' | 'view_count'>): Promise<number> => {
  const db = await getDb();
  await db.execute(
    `INSERT INTO comics (path, source_type, title, artist, series, issue, cover_image_path, page_count, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, datetime('now'))
     ON CONFLICT(path) DO UPDATE SET
       source_type = excluded.source_type,
       title = excluded.title,
       artist = excluded.artist,
       series = excluded.series,
       issue = excluded.issue,
       cover_image_path = excluded.cover_image_path,
       page_count = excluded.page_count,
       updated_at = datetime('now')`,
    [comic.path, comic.source_type ?? 'image', comic.title, comic.artist, comic.series, comic.issue, comic.cover_image_path, comic.page_count]
  );

  const results = await db.select<{ id: number }[]>('SELECT id FROM comics WHERE path = $1', [comic.path]);
  if (results.length === 0) {
    throw new Error(`Failed to retrieve comic ID after upsert for path: ${comic.path}`);
  }
  return results[0].id;
};

export const deleteComic = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute('DELETE FROM comics WHERE id = $1', [id]);
  window.dispatchEvent(new CustomEvent('favorites-updated'));
};

export const toggleFavorite = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute('UPDATE comics SET is_favorite = NOT is_favorite, updated_at = datetime(\'now\') WHERE id = $1', [id]);
  window.dispatchEvent(new CustomEvent('favorites-updated'));
};

export const toggleViewed = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute('UPDATE comics SET is_viewed = NOT is_viewed WHERE id = $1', [id]);
  window.dispatchEvent(new CustomEvent('favorites-updated'));
};

export const incrementViewCount = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute('UPDATE comics SET view_count = view_count + 1 WHERE id = $1', [id]);
  window.dispatchEvent(new CustomEvent('favorites-updated'));
};

export const decrementViewCount = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute('UPDATE comics SET view_count = MAX(0, view_count - 1) WHERE id = $1', [id]);
  window.dispatchEvent(new CustomEvent('favorites-updated'));
};

export const updateComicLastOpened = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute('UPDATE comics SET last_opened_at = datetime(\'now\') WHERE id = $1', [id]);
  window.dispatchEvent(new CustomEvent('favorites-updated'));
  window.dispatchEvent(new CustomEvent('comic-opened'));
};

export const setBookmark = async (id: number, pageNumber: number): Promise<void> => {
  const db = await getDb();
  await db.execute('UPDATE comics SET bookmark_page = $1, updated_at = datetime(\'now\') WHERE id = $2', [pageNumber, id]);
  window.dispatchEvent(new CustomEvent('favorites-updated'));
};

export const clearBookmark = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute('UPDATE comics SET bookmark_page = NULL, updated_at = datetime(\'now\') WHERE id = $1', [id]);
  window.dispatchEvent(new CustomEvent('favorites-updated'));
};

export const getBookmarkedComics = async (): Promise<Comic[]> => {
  const db = await getDb();
  return await db.select<Comic[]>(`
    SELECT c.*, p.thumbnail_path 
    FROM comics c 
    LEFT JOIN comic_pages p ON c.id = p.comic_id AND p.page_number = 1
    WHERE c.bookmark_page IS NOT NULL
    ORDER BY c.updated_at DESC
  `);
};

export const getFavoriteComics = async (): Promise<Comic[]> => {
  const db = await getDb();
  return await db.select<Comic[]>(`
    SELECT c.*, p.thumbnail_path 
    FROM comics c 
    LEFT JOIN comic_pages p ON c.id = p.comic_id AND p.page_number = 1
    WHERE c.is_favorite = 1 
    ORDER BY c.updated_at DESC
  `);
};

export const getRecentlyOpenedComics = async (limit: number = 6): Promise<Comic[]> => {
  const db = await getDb();
  return await db.select<Comic[]>(`
    SELECT c.*, p.thumbnail_path 
    FROM comics c 
    LEFT JOIN comic_pages p ON c.id = p.comic_id AND p.page_number = 1
    WHERE c.last_opened_at IS NOT NULL
    ORDER BY c.last_opened_at DESC
    LIMIT $1
  `, [limit]);
};
