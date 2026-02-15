import { ComicPage } from './comic';

export type Gallery = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  page_count?: number;
  is_favorite?: number;
  view_count?: number;
  last_opened_at?: string | null;
  thumbnail_path?: string | null;
};

export type GalleryWithPages = Gallery & {
  pages: ComicPage[];
};
