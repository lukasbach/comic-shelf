export type Tab = {
  id: string;           // unique ID
  title: string;        // display name
  type: 'comic' | 'library';
  comicId?: number;      // database comic ID (if type === 'comic')
  path: string;          // route path
  currentPage?: number;  // last viewed page
  viewMode?: 'overview' | 'single' | 'scroll';
  zoomLevel?: number;
};
