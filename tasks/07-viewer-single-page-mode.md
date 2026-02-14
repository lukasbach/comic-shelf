# Task 7: Comic Viewer — Single Page Mode

**Reference:** [requirements.md](../requirements.md)

## Objective
Implement the single-page viewing mode where one page is displayed at a time with navigation controls, zoom, and a sidebar with upcoming page thumbnails.

## Components

### 1. Single Page Mode Component

Create `src/components/viewer/single-page-mode.tsx`:

```tsx
type SinglePageModeProps = {
  comic: Comic;
  pages: ComicPage[];
};
```

Layout:
```
┌─────────────────────────────────┬──────────┐
│                                 │ Sidebar  │
│                                 │          │
│         Main Image Area         │ Thumbs   │
│     (scrollable if zoomed)      │ Nav      │
│                                 │ Controls │
│                                 │          │
├─────────────────────────────────┤          │
│  ◄ Prev  │  Page X / N  │ Next ►│          │
└─────────────────────────────────┴──────────┘
```

The main image area:
- Displays the current page image at full resolution
- Uses `getImageUrl(currentPage.file_path)` for the src
- **Width-fit mode** (default): Image width equals the container width, height is auto — the container scrolls vertically if the image is taller than the viewport
- **Zoom mode**: Image is displayed at the configured zoom percentage. Container scrolls both horizontally and vertically as needed.
- The zoom level comes from the active tab's `zoomLevel` (default from settings)
- Smooth transition when switching pages (optional: simple fade)

### 2. Image Display Logic

Create `src/components/viewer/page-image.tsx`:

```tsx
type PageImageProps = {
  page: ComicPage;
  zoomLevel: number;  // percentage: 100 = fit width, >100 = zoomed in
  containerRef: RefObject<HTMLDivElement>;
};
```

Implementation:
- When `zoomLevel === 100` (fit-width): `width: 100%; height: auto;`
- When `zoomLevel > 100`: `width: ${zoomLevel}%; height: auto;` — the container div has `overflow: auto` to enable scrolling
- The container div (`ref={containerRef}`) is needed for slideshow scroll automation (task 9)

### 3. Navigation Controls

Create `src/components/viewer/page-navigation.tsx`:

```tsx
type PageNavigationProps = {
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onGoToPage: (page: number) => void;
};
```

Features:
- Previous / Next buttons (disabled at boundaries)
- Current page indicator: "Page 5 / 42"
- Click on page indicator to open a page number input for direct navigation
- Keyboard navigation handled in parent (task 10 - hotkeys)

### 4. Viewer Sidebar

Create `src/components/viewer/viewer-sidebar.tsx`:

```tsx
type ViewerSidebarProps = {
  pages: ComicPage[];
  currentPage: number;
  onPageSelect: (pageNumber: number) => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  viewMode: 'overview' | 'single' | 'scroll';
  onViewModeChange: (mode: 'overview' | 'single' | 'scroll') => void;
};
```

The sidebar contains:

**Page thumbnails section:**
- Shows thumbnails of the next ~5 pages relative to current page
- Uses cached thumbnails for display: `getImageUrl(page.thumbnail_path)` if available, otherwise falls back to `getImageUrl(page.file_path)`. Cached thumbnails (generated during indexing, task 4) are much smaller and load faster than full-resolution images.
- Current page thumbnail is highlighted
- Clicking a thumbnail navigates to that page
- Scrollable if many pages

**Display controls section:**
- Zoom slider (50% — 300%, step 10%)
- Zoom presets: "Fit Width" (100%), "Fit Height", "200%", "300%"
- View mode buttons: Overview / Single / Scroll

**Navigation section:**
- Previous / Next page buttons (duplicates the bottom bar for convenience)
- Page number display

The sidebar is:
- Fixed width (280px)
- On the right side of the viewer
- Vertically scrollable independently
- Collapsible via a toggle button (saves state in tab)

### 5. Page State Management

The current page number is stored in the tab context (`activeTab.currentPage`). 

Navigation functions update the tab:
```typescript
const goToPage = (pageNumber: number) => {
  updateTab(activeTabId, { currentPage: pageNumber });
};

const nextPage = () => {
  if (activeTab.currentPage < pages.length - 1) {
    goToPage(activeTab.currentPage + 1);
  }
};

const prevPage = () => {
  if (activeTab.currentPage > 0) {
    goToPage(activeTab.currentPage - 1);
  }
};
```

The zoom level is also stored in the tab: `activeTab.zoomLevel`.

### 6. Image Preloading

Create `src/hooks/use-preload-images.ts`:

Preload adjacent page images for smoother navigation:
```typescript
export const usePreloadImages = (pages: ComicPage[], currentPage: number, preloadCount = 3) => {
  useEffect(() => {
    const pagesToPreload = pages.slice(
      Math.max(0, currentPage - 1),
      Math.min(pages.length, currentPage + preloadCount + 1)
    );
    
    pagesToPreload.forEach(page => {
      const img = new Image();
      img.src = getImageUrl(page.file_path);
    });
  }, [pages, currentPage, preloadCount]);
};
```

### 7. Single Page Mode Integration

In the `SinglePageMode` component:
1. Read `currentPage` and `zoomLevel` from the active tab
2. Get the current page data from the pages array
3. Render `PageImage` in the main area
4. Render `ViewerSidebar` on the right
5. Render `PageNavigation` at the bottom
6. Call `usePreloadImages` for adjacent pages

## Acceptance Criteria
- Single page mode displays one page at a time
- Page fits the container width by default (fit-width mode)
- Zoom control changes the image size, enabling scroll when zoomed
- Sidebar shows upcoming page thumbnails, zoom controls, and navigation
- Previous/Next buttons navigate between pages
- Direct page number input allows jumping to any page
- Adjacent pages are preloaded for smooth navigation
- Current page state persists in the tab (switching tabs and back preserves position)
- Sidebar is collapsible
