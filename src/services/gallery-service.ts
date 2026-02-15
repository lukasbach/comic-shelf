import { getDb } from './database';
import { Gallery } from '../types/gallery';
import { ComicPage } from '../types/comic';

export const getGalleries = async (): Promise<Gallery[]> => {
  const db = await getDb();
  return await db.select<Gallery[]>(`
    SELECT g.*, COUNT(gp.id) as page_count,
      (SELECT cp.thumbnail_path 
       FROM gallery_pages gp2 
       JOIN comic_pages cp ON gp2.comic_page_id = cp.id 
       WHERE gp2.gallery_id = g.id 
       ORDER BY gp2.added_at ASC 
       LIMIT 1) as thumbnail_path
    FROM galleries g
    LEFT JOIN gallery_pages gp ON g.id = gp.gallery_id
    GROUP BY g.id
    ORDER BY g.name ASC
  `);
};

export const getGalleryById = async (id: number): Promise<Gallery | null> => {
  const db = await getDb();
  const results = await db.select<Gallery[]>(`
    SELECT g.*, COUNT(gp.id) as page_count,
      (SELECT cp.thumbnail_path 
       FROM gallery_pages gp2 
       JOIN comic_pages cp ON gp2.comic_page_id = cp.id 
       WHERE gp2.gallery_id = g.id 
       ORDER BY gp2.added_at ASC 
       LIMIT 1) as thumbnail_path
    FROM galleries g
    LEFT JOIN gallery_pages gp ON g.id = gp.gallery_id
    WHERE g.id = $1
    GROUP BY g.id
  `, [id]);
  return results.length > 0 ? results[0] : null;
};

export const toggleGalleryFavorite = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`UPDATE galleries SET is_favorite = NOT is_favorite WHERE id = $1`, [id]);
};

export const incrementGalleryViewCount = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`UPDATE galleries SET view_count = view_count + 1, last_opened_at = datetime('now') WHERE id = $1`, [id]);
};

export const decrementGalleryViewCount = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`UPDATE galleries SET view_count = MAX(0, view_count - 1) WHERE id = $1`, [id]);
};

export const toggleGalleryViewed = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`UPDATE galleries SET last_opened_at = CASE WHEN last_opened_at IS NULL THEN datetime('now') ELSE NULL END WHERE id = $1`, [id]);
};

export const updateGalleryLastOpened = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`UPDATE galleries SET last_opened_at = datetime('now') WHERE id = $1`, [id]);
};

export const getGalleryPages = async (galleryId: number): Promise<ComicPage[]> => {
  const db = await getDb();
  return await db.select<ComicPage[]>(`
    SELECT cp.*
    FROM comic_pages cp
    JOIN gallery_pages gp ON cp.id = gp.comic_page_id
    WHERE gp.gallery_id = $1
    ORDER BY gp.added_at ASC
  `, [galleryId]);
};

export const createGallery = async (name: string): Promise<number> => {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO galleries (name, created_at, updated_at) VALUES ($1, datetime('now'), datetime('now'))`,
    [name]
  );
  if (result.lastInsertId === undefined) {
    throw new Error('Failed to create gallery: lastInsertId is undefined');
  }
  return result.lastInsertId;
};

export const deleteGallery = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(`DELETE FROM galleries WHERE id = $1`, [id]);
};

export const addPageToGallery = async (galleryId: number, comicPageId: number): Promise<void> => {
  const db = await getDb();
  await db.execute(
    `INSERT OR IGNORE INTO gallery_pages (gallery_id, comic_page_id, added_at) VALUES ($1, $2, datetime('now'))`,
    [galleryId, comicPageId]
  );
  await db.execute(
    `UPDATE galleries SET updated_at = datetime('now') WHERE id = $1`,
    [galleryId]
  );
};

export const removePageFromGallery = async (galleryId: number, comicPageId: number): Promise<void> => {
  const db = await getDb();
  await db.execute(
    `DELETE FROM gallery_pages WHERE gallery_id = $1 AND comic_page_id = $2`,
    [galleryId, comicPageId]
  );
  await db.execute(
    `UPDATE galleries SET updated_at = datetime('now') WHERE id = $1`,
    [galleryId]
  );
};

export const updateGalleryName = async (id: number, name: string): Promise<void> => {
  const db = await getDb();
  await db.execute(
    `UPDATE galleries SET name = $1, updated_at = datetime('now') WHERE id = $2`,
    [name, id]
  );
};

export const getPageGalleries = async (comicPageId: number): Promise<Gallery[]> => {
  const db = await getDb();
  return await db.select<Gallery[]>(`
    SELECT g.*
    FROM galleries g
    JOIN gallery_pages gp ON g.id = gp.gallery_id
    WHERE gp.comic_page_id = $1
  `, [comicPageId]);
};
