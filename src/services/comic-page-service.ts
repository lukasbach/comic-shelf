import { getDb } from './database';
import type { ComicPage } from '../types/comic';

export const getPagesByComicId = async (comicId: number): Promise<ComicPage[]> => {
  const db = await getDb();
  return await db.select<ComicPage[]>(
    'SELECT * FROM comic_pages WHERE comic_id = $1 ORDER BY page_number ASC',
    [comicId]
  );
};

export const insertPages = async (
  comicId: number,
  pages: Omit<ComicPage, 'id' | 'comic_id' | 'is_favorite' | 'view_count'>[]
): Promise<void> => {
  const db = await getDb();
  // We can't do bulk insert easily with parameters in tauri-plugin-sql without constructing a large query
  // or doing multiple executes. For simplicity and safety, we'll do them in a loop, 
  // though a transaction would be better if supported.
  for (const page of pages) {
    await db.execute(
      `INSERT INTO comic_pages (comic_id, page_number, file_path, file_name, thumbnail_path)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT(comic_id, page_number) DO UPDATE SET
         file_path = excluded.file_path,
         file_name = excluded.file_name,
         thumbnail_path = COALESCE(excluded.thumbnail_path, comic_pages.thumbnail_path)`,
      [comicId, page.page_number, page.file_path, page.file_name, page.thumbnail_path]
    );
  }

  // Delete pages that are no longer present
  await db.execute(
    'DELETE FROM comic_pages WHERE comic_id = $1 AND page_number > $2',
    [comicId, pages.length]
  );
};

export const updateThumbnailPath = async (id: number, thumbnailPath: string): Promise<void> => {
  const db = await getDb();
  await db.execute('UPDATE comic_pages SET thumbnail_path = $1 WHERE id = $2', [thumbnailPath, id]);
};

export const togglePageFavorite = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute('UPDATE comic_pages SET is_favorite = NOT is_favorite WHERE id = $1', [id]);
};

export const togglePageViewed = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute('UPDATE comic_pages SET is_viewed = NOT is_viewed WHERE id = $1', [id]);
};

export const incrementPageViewCount = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute('UPDATE comic_pages SET view_count = view_count + 1 WHERE id = $1', [id]);
};

export const decrementPageViewCount = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute('UPDATE comic_pages SET view_count = MAX(0, view_count - 1) WHERE id = $1', [id]);
};

export const updatePageLastOpened = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute('UPDATE comic_pages SET last_opened_at = datetime(\'now\') WHERE id = $1', [id]);
  window.dispatchEvent(new CustomEvent('comic-opened'));
};

export const getAllPages = async (): Promise<(ComicPage & { comic_title: string; comic_path: string; comic_artist: string | null })[]> => {
  const db = await getDb();
  return await db.select<(ComicPage & { comic_title: string; comic_path: string; comic_artist: string | null })[]>(`
    SELECT p.*, c.title as comic_title, c.path as comic_path, c.artist as comic_artist
    FROM comic_pages p 
    JOIN comics c ON p.comic_id = c.id 
    ORDER BY c.title ASC, p.page_number ASC
  `);
};

export const getFavoritePages = async (): Promise<(ComicPage & { comic_title: string })[]> => {
  const db = await getDb();
  return await db.select<(ComicPage & { comic_title: string })[]>(`
    SELECT p.*, c.title as comic_title 
    FROM comic_pages p 
    JOIN comics c ON p.comic_id = c.id 
    WHERE p.is_favorite = 1
    ORDER BY c.title ASC, p.page_number ASC
  `);
};

export const getRecentlyOpenedPages = async (limit: number = 6): Promise<(ComicPage & { comic_title: string })[]> => {
  const db = await getDb();
  return await db.select<(ComicPage & { comic_title: string })[]>(`
    SELECT p.*, c.title as comic_title 
    FROM comic_pages p 
    JOIN comics c ON p.comic_id = c.id 
    WHERE p.last_opened_at IS NOT NULL
    ORDER BY p.last_opened_at DESC
    LIMIT $1
  `, [limit]);
};
