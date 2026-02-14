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

export const searchComics = async (query: string): Promise<Comic[]> => {
  const db = await getDb();
  const searchPattern = `%${query}%`;
  return await db.select<Comic[]>(`
    SELECT c.*, p.thumbnail_path 
    FROM comics c 
    LEFT JOIN comic_pages p ON c.id = p.comic_id AND p.page_number = 1
    WHERE c.title LIKE $1 OR c.artist LIKE $1 OR c.series LIKE $1 
    ORDER BY c.title ASC
  `, [searchPattern]);
};

export const upsertComic = async (comic: Omit<Comic, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const db = await getDb();
  await db.execute(
    `INSERT INTO comics (path, title, artist, series, issue, cover_image_path, page_count, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, datetime('now'))
     ON CONFLICT(path) DO UPDATE SET
       title = excluded.title,
       artist = excluded.artist,
       series = excluded.series,
       issue = excluded.issue,
       cover_image_path = excluded.cover_image_path,
       page_count = excluded.page_count,
       updated_at = datetime('now')`,
    [comic.path, comic.title, comic.artist, comic.series, comic.issue, comic.cover_image_path, comic.page_count]
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
};

export const toggleFavorite = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute('UPDATE comics SET is_favorite = NOT is_favorite WHERE id = $1', [id]);
};

export const incrementViewCount = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute('UPDATE comics SET view_count = view_count + 1 WHERE id = $1', [id]);
};

export const getFavoriteComics = async (): Promise<Comic[]> => {
  const db = await getDb();
  return await db.select<Comic[]>(`
    SELECT c.*, p.thumbnail_path 
    FROM comics c 
    LEFT JOIN comic_pages p ON c.id = p.comic_id AND p.page_number = 1
    WHERE c.is_favorite = 1 
    ORDER BY c.title ASC
  `);
};
