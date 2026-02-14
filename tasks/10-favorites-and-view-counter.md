# Task 10: Favorites & View Counter System

**Reference:** [requirements.md](../requirements.md)

## Objective
Implement the favorite toggle and view counter features for both comics and individual pages. Add UI controls for interacting with these features throughout the app.

## Features

### 1. Favorite Toggle — Comics

Users can favorite/unfavorite comics. The favorite state is stored in the `comics.is_favorite` column.

**Toggle button in ComicCard** (`src/components/comic-card.tsx`):
- Add a star icon button (⭐/☆) to the comic card
- Click toggles `is_favorite` via `comicService.toggleFavorite(id)`
- Optimistic UI: update state immediately, revert on error
- Positioned in the top-right corner of the card overlay

**Toggle in Viewer header**:
- Add a star icon in the `ViewerHeader` component
- Shows filled star if comic is favorited
- Clicking toggles the favorite state

### 2. Favorite Toggle — Individual Pages

Users can favorite/unfavorite individual pages. Stored in `comic_pages.is_favorite`.

**In Overview Mode** (`overview-mode.tsx`):
- Each page thumbnail shows a small star icon on hover
- Clicking the star toggles `comicPageService.togglePageFavorite(id)`

**In Single Page Mode** (`single-page-mode.tsx`):
- Add a favorite button in the navigation bar or sidebar
- Stars icon shows current favorite state of the current page
- Clicking toggles the favorite for the displayed page

**In Scroll Mode** (`scroll-mode.tsx`):
- Each page has a small floating favorite button in the top-right corner
- Only visible on hover over that page
- Toggles favorite for that specific page

### 3. View Counter — Comics

Each comic has a `view_count` that is **only incremented when the user clicks a counter button**, not automatically on open.

**Counter display & button in ComicCard**:
- Show view count as a badge (e.g., "👁 5")
- An increment button (eye icon + "+") that calls `comicService.incrementViewCount(id)`
- Positioned subtly in the card

**Counter in Viewer header**:
- Show current view count in the viewer header
- Provide an increment button ("+1" or eye icon)

### 4. View Counter — Individual Pages

Each page has its own `view_count`, also incremented only on user click.

**In Single Page Mode** (`single-page-mode.tsx`):
- Small eye icon + count display in the navigation bar
- Click to increment `comicPageService.incrementPageViewCount(id)`

**In Overview Mode** (as badge on thumbnail):
- Show view count badge on each thumbnail
- Click on badge to increment

### 5. Favorites Library View Integration 

The favorites view (from task 5) should already be connected to the database. Ensure:

**`src/routes/library/favorites.tsx`** properly fetches:
- `comicService.getFavoriteComics()` → renders as comic grid
- `comicPageService.getFavoritePages()` → renders as image grid

Each favorite page entry in the favorites view should:
- Show the page image thumbnail
- Show parent comic title and page number
- Clicking opens the comic in the viewer at that page:
```typescript
const openComic = useOpenComic();
// When clicking a favorite page:
const parentComic = await comicService.getComicById(page.comic_id);
if (parentComic) {
  openComic(parentComic);
  // After tab is created, update to the specific page
  updateTab(activeTabId, { currentPage: page.page_number });
}
```

### 6. Service Functions

Ensure these DB operations exist (from task 2):

**`comic-service.ts`:**
```typescript
export const toggleFavorite = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(
    'UPDATE comics SET is_favorite = CASE WHEN is_favorite = 0 THEN 1 ELSE 0 END WHERE id = $1',
    [id]
  );
};

export const incrementViewCount = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(
    'UPDATE comics SET view_count = view_count + 1 WHERE id = $1',
    [id]
  );
};

export const getFavoriteComics = async (): Promise<Comic[]> => {
  const db = await getDb();
  return db.select('SELECT * FROM comics WHERE is_favorite = 1 ORDER BY title', []);
};
```

**`comic-page-service.ts`:**
```typescript
export const togglePageFavorite = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(
    'UPDATE comic_pages SET is_favorite = CASE WHEN is_favorite = 0 THEN 1 ELSE 0 END WHERE id = $1',
    [id]
  );
};

export const incrementPageViewCount = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.execute(
    'UPDATE comic_pages SET view_count = view_count + 1 WHERE id = $1',
    [id]
  );
};

export const getFavoritePages = async (): Promise<(ComicPage & { comic_title: string })[]> => {
  const db = await getDb();
  return db.select(
    'SELECT cp.*, c.title as comic_title FROM comic_pages cp JOIN comics c ON cp.comic_id = c.id WHERE cp.is_favorite = 1 ORDER BY c.title, cp.page_number',
    []
  );
};
```

### 7. UI Components

Create `src/components/favorite-button.tsx`:
```tsx
type FavoriteButtonProps = {
  isFavorite: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
};
```
- Reusable star toggle button
- Filled/outlined star icon
- Animated transition on toggle

Create `src/components/view-counter.tsx`:
```tsx
type ViewCounterProps = {
  count: number;
  onIncrement: () => void;
  size?: 'sm' | 'md' | 'lg';
};
```
- Shows eye icon + count number
- Plus button to increment
- Brief animation on increment (number flash)

## Acceptance Criteria
- Comics can be favorited/unfavorited from cards and viewer
- Individual pages can be favorited from overview, single page, and scroll modes
- View counters for comics and pages are displayed and only increment on manual click
- Favorites view correctly shows all favorited comics and pages
- Clicking a favorited page opens the comic at that specific page
- Toggling favorites and incrementing counts update the UI immediately (optimistic)
- Database operations correctly toggle and increment values
