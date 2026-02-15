import { ComicPage } from './comic';

export type Gallery = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  page_count?: number;
  is_favorite?: number;
  view_count?: number;
  is_viewed?: number;
};

export type GalleryWithPages = Gallery & {
  pages: ComicPage[];
};
