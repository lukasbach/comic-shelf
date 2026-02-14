export type Tab = {
  id: string;           // unique ID
  comicId: number;      // database comic ID
  title: string;        // display name
  currentPage: number;  // last viewed page
  viewMode: 'overview' | 'single' | 'scroll';
  zoomLevel: number;
};
