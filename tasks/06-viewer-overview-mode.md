# Task 6: Comic Viewer — Overview Mode

**Reference:** [requirements.md](../requirements.md)

## Objective
Implement the overview mode of the comic viewer, which displays all pages of a comic as thumbnails in a grid. Clicking a thumbnail jumps to that page in single-page view.

## Route

This is part of `src/routes/viewer/$comicId.tsx`. The viewer route handles all three view modes (overview, single, scroll). This task implements the overall viewer structure and the overview mode specifically.

## Viewer Structure

### 1. Viewer Route Component

Create `src/routes/viewer/$comicId.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/viewer/$comicId')({
  component: ComicViewerPage,
})
```

The `ComicViewerPage` component:
1. Reads `comicId` from route params
2. Loads the comic and its pages from the database
3. Gets the active tab from tab context (or creates one if accessed directly)
4. Renders the appropriate view mode based on tab state

```tsx
const ComicViewerPage: FC = () => {
  const { comicId } = Route.useParams();
  const { tabs, activeTabId, updateTab } = useTabContext();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const viewMode = activeTab?.viewMode ?? 'overview';

  // Load comic & pages
  const { comic, pages, loading } = useComicData(Number(comicId));

  if (loading) return <LoadingSpinner />;
  if (!comic) return <NotFound />;

  switch (viewMode) {
    case 'overview':
      return <OverviewMode comic={comic} pages={pages} />;
    case 'single':
      return <SinglePageMode comic={comic} pages={pages} />;  // Task 7
    case 'scroll':
      return <ScrollMode comic={comic} pages={pages} />;      // Task 8
  }
};
```

### 2. Comic Data Hook

Create `src/hooks/use-comic-data.ts`:

```typescript
export const useComicData = (comicId: number) => {
  const [comic, setComic] = useState<Comic | null>(null);
  const [pages, setPages] = useState<ComicPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      comicService.getComicById(comicId),
      comicPageService.getPagesByComicId(comicId),
    ]).then(([c, p]) => {
      setComic(c);
      setPages(p);
    }).finally(() => setLoading(false));
  }, [comicId]);

  return { comic, pages, loading };
};
```

### 3. Overview Mode Component

Create `src/components/viewer/overview-mode.tsx`:

```tsx
type OverviewModeProps = {
  comic: Comic;
  pages: ComicPage[];
};
```

Features:
- Displays all pages as thumbnails in a responsive grid
- Each thumbnail shows:
  - Page image (scaled down)
  - Page number overlay (bottom-right corner)
  - Favorite indicator (⭐) if the page is favorited
- Grid uses Tailwind: `grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 p-4`
- Clicking a thumbnail:
  1. Updates the active tab's `currentPage` to the clicked page number
  2. Updates the active tab's `viewMode` to `'single'`
  3. This triggers re-render to show SinglePageMode at that page

### 4. Page Thumbnail Component

Create `src/components/viewer/page-thumbnail.tsx`:

```tsx
type PageThumbnailProps = {
  page: ComicPage;
  isActive: boolean;
  onClick: () => void;
};
```

- Uses the cached thumbnail for display: `getImageUrl(page.thumbnail_path)` if available, otherwise falls back to `getImageUrl(page.file_path)`. Thumbnails are generated during indexing (task 4) and are much smaller, making the overview grid load significantly faster.
- Lazy loads images using `loading="lazy"` attribute
- Shows page number badge
- Hover effect: slight scale up, border highlight
- Active page (if viewing in split mode later): highlighted border

### 5. Viewer Header

Create `src/components/viewer/viewer-header.tsx`:

A toolbar at the top of the viewer area (below the app top bar) showing:
- Comic title
- Page count (e.g., "42 pages")
- View mode switcher: three icon buttons for Overview / Single / Scroll
- The active mode is highlighted
- Clicking a mode updates the tab's `viewMode`

```tsx
type ViewerHeaderProps = {
  comic: Comic;
  pageCount: number;
  currentMode: 'overview' | 'single' | 'scroll';
  onModeChange: (mode: 'overview' | 'single' | 'scroll') => void;
};
```

### 6. Loading & Error States

Create `src/components/viewer/loading-spinner.tsx`:
- Simple centered spinner with "Loading..." text

Create `src/components/viewer/not-found.tsx`:
- "Comic not found" message with a link back to library

## Acceptance Criteria
- Navigating to `/viewer/:comicId` loads the comic and its pages
- Overview mode displays all pages as a thumbnail grid
- Page numbers are visible on each thumbnail
- Clicking a thumbnail switches to single-page mode at that page
- View mode switcher in the viewer header changes between modes
- Loading and error states are handled gracefully
- Images load lazily for performance
