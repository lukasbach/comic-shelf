# Task 8: Comic Viewer — Scroll Mode

**Reference:** [requirements.md](../requirements.md)

## Objective
Implement the scroll (continuous) viewing mode where all pages are rendered vertically below each other. The user scrolls through them continuously. Supports fit-width and zoom modes.

## Components

### 1. Scroll Mode Component

Create `src/components/viewer/scroll-mode.tsx`:

```tsx
type ScrollModeProps = {
  comic: Comic;
  pages: ComicPage[];
};
```

Layout:
```
┌──────────────────────────────┐
│         Page 1 image         │
│                              │
├──────────────────────────────┤
│         Page 2 image         │
│                              │
├──────────────────────────────┤
│         Page 3 image         │
│                              │
│           ...                │
└──────────────────────────────┘
```

Features:
- All pages rendered in a single scrollable container
- Each page image stacked vertically with a small gap (8px) between pages
- Fit-width mode (default): each image width = container width
- Zoom mode: each image width = container width × (zoomLevel / 100), horizontal scroll enabled
- A thin page number indicator/separator between pages showing "Page N"
- The scroll container ref is needed for slideshow automation (task 9)

### 2. Virtualization

For comics with many pages (50+), rendering all images at once is expensive. Implement lazy rendering:

**Option A — Intersection Observer (recommended):**
Each page is wrapped in a container with a fixed estimated height. Use `IntersectionObserver` to detect when a page is near the viewport:

Create `src/components/viewer/lazy-page.tsx`:

```tsx
type LazyPageProps = {
  page: ComicPage;
  zoomLevel: number;
  onVisible: (pageNumber: number) => void;
};
```

- Each `LazyPage` renders a placeholder div with estimated height until intersecting
- Once visible (within 1 viewport of being on screen), loads and displays the actual image
- Calls `onVisible` when the page enters the viewport — used to update the current page indicator
- Once loaded, the image stays rendered (no unloading, to preserve smooth scrolling)

Implementation:
```typescript
const [isVisible, setIsVisible] = useState(false);
const ref = useRef<HTMLDivElement>(null);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        onVisible(page.page_number);
      }
    },
    { rootMargin: '100%' } // preload 1 viewport ahead
  );
  
  if (ref.current) observer.observe(ref.current);
  return () => observer.disconnect();
}, []);
```

### 3. Current Page Tracking

As the user scrolls, detect which page is currently in view:

Create `src/hooks/use-scroll-page-tracker.ts`:

```typescript
export const useScrollPageTracker = (
  containerRef: RefObject<HTMLDivElement>,
  pageRefs: RefObject<(HTMLDivElement | null)[]>,
  onPageChange: (pageNumber: number) => void
) => { ... };
```

- Uses `IntersectionObserver` on each page element
- When a page crosses the center of the viewport, calls `onPageChange`
- Updates the tab's `currentPage` to keep the breadcrumbs and sidebar in sync

### 4. Scroll-to-Page

When switching from overview or single-page mode to scroll mode, scroll to the current page:

```typescript
const scrollToPage = (pageNumber: number) => {
  const pageElement = pageRefs.current?.[pageNumber];
  pageElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
```

Call this on mount if `currentPage > 0`.

### 5. Floating Page Indicator

Create `src/components/viewer/scroll-page-indicator.tsx`:

A floating indicator in the bottom-right corner showing:
- Current page / total pages (e.g., "Page 12 / 42")
- Only appears while scrolling (fade in/out with a 2-second timeout)
- Semi-transparent background

### 6. Zoom in Scroll Mode

- Fit-width (zoomLevel = 100): Images fill container width
- Zoomed: Images are scaled larger. The container allows horizontal scrolling.
- The zoom level affects all pages uniformly
- Zoom controls from the viewer header (task 6) or sidebar (task 7) work here too

Image sizing:
```tsx
const imageStyle = zoomLevel === 100
  ? { width: '100%', height: 'auto' }
  : { width: `${zoomLevel}%`, height: 'auto' };
```

The scroll container:
```tsx
<div 
  ref={scrollContainerRef}
  className="overflow-auto h-full"
  style={{ overflowX: zoomLevel > 100 ? 'auto' : 'hidden' }}
>
  {pages.map(page => (
    <LazyPage key={page.id} page={page} zoomLevel={zoomLevel} onVisible={handlePageVisible} />
  ))}
</div>
```

### 7. Integration with Tab State

- `currentPage` updates as the user scrolls (via scroll tracker)
- `zoomLevel` from tab state applies to all images
- Switching to scroll mode from single-page scrolls to the last viewed page

## Acceptance Criteria
- All pages render vertically in a continuous scroll
- Lazy loading prevents rendering all images at once (uses IntersectionObserver)
- Current page updates in the tab as the user scrolls
- Page indicator shows current page while scrolling
- Fit-width mode fills the container; zoom mode allows horizontal scroll
- Switching from single-page to scroll mode preserves the current page position
- Vertical spacing between pages is consistent
- Performance is acceptable for comics with 50+ pages
