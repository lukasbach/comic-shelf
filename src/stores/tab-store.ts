export type Tab = {
  id: string;           // unique ID
  title: string;        // display name
  type: 'comic' | 'library';
  comicId?: number;      // database comic ID (if type === 'comic')
  galleryId?: number;    // database gallery ID (if type === 'comic')
  comicPath?: string;    // database comic path (if type === 'comic')
  path: string;          // route path
  currentPage?: number;  // last viewed page
  viewMode?: 'overview' | 'single' | 'scroll';
  zoomLevel?: number;
  fitMode?: 'width' | 'none';
  sidebarCollapsed?: boolean;
  slideshowActive?: boolean;
};
