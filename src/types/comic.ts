export type Comic = {
  id: number;
  path: string;
  title: string;
  artist: string | null;
  series: string | null;
  issue: string | null;
  cover_image_path: string | null;
  page_count: number;
  is_favorite: number; // SQLite boolean (0/1)
  view_count: number;
  created_at: string;
  updated_at: string;
  thumbnail_path?: string | null;
};

export type ComicPage = {
  id: number;
  comic_id: number;
  page_number: number;
  file_path: string;
  file_name: string;
  thumbnail_path: string | null;
  is_favorite: number;
  view_count: number;
};

export type IndexPath = {
  id: number;
  path: string;
  pattern: string;
  created_at: string;
};
