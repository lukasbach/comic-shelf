import { ComicPage } from './comic';

export type Gallery = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  page_count?: number;
};

export type GalleryWithPages = Gallery & {
  pages: ComicPage[];
};
