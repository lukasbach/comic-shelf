export type Comic = {
  id: number;
  path: string;
  source_type?: 'image' | 'pdf' | 'archive';
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
  last_opened_at: string | null;
  bookmark_page: number | null;
  indexing_status: 'pending' | 'processing' | 'completed' | 'failed';
  indexing_error?: string | null;
  thumbnail_path?: string | null;
};

export type ArtistMetadata = {
  artist: string;
  comic_count: number;
  thumbnail_path: string | null;
};

export type ComicPage = {
  id: number;
  comic_id: number;
  page_number: number;
  file_path: string;
  file_name: string;
  source_type?: 'image' | 'pdf' | 'archive';
  source_path?: string | null;
  archive_entry_path?: string | null;
  pdf_page_number?: number | null;
  thumbnail_path: string | null;
  is_favorite: number;
  view_count: number;
  last_opened_at: string | null;
};

export type IndexPath = {
  id: number;
  path: string;
  pattern: string;
  created_at: string;
};
