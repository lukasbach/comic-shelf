# Task 5: Comic Library Views

**Reference:** [requirements.md](../requirements.md)

## Objective
Implement all library browsing views: file explorer (tree), flat list, per-artist grouped view, favorites view, and global search. Each view displays comic covers and metadata, and allows opening comics in the viewer.

## Shared Components

### 1. Comic Card Component

Create `src/components/comic-card.tsx`:

A reusable card displaying a comic's cover thumbnail, title, artist, and metadata.

```tsx
type ComicCardProps = {
  comic: Comic;
  onOpen: (comic: Comic) => void;
};
```

Features:
- Shows cover image using the cached thumbnail: `getImageUrl(comic.cover_image_path)` — the cover thumbnail is generated during indexing (task 4). For comic cards, prefer the thumbnail version for faster loading. If a `thumbnail_path` exists on the first page, use `getImageUrl(firstPage.thumbnail_path)` for the cover; otherwise fall back to the full-resolution `cover_image_path`.
- Displays title, artist, series, page count
- Favorite indicator (⭐ if favorited)
- View count badge
- Click to open (calls `onOpen`)
- Right-click or long-press for context menu (favorite toggle)

Styling:
- Card layout with fixed-aspect-ratio cover image (3:4 ratio)
- Rounded corners, subtle shadow
- Hover effect (slight scale/shadow change)
- `grid` compat (sized to fill grid cells)

### 2. Comic Grid Component

Create `src/components/comic-grid.tsx`:

A responsive grid of `ComicCard` components.

```tsx
type ComicGridProps = {
  comics: Comic[];
  onOpenComic: (comic: Comic) => void;
};
```

Uses Tailwind grid: `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4`

### 3. Comic Open Handler Hook

Create `src/hooks/use-open-comic.ts`:

```typescript
import { useNavigate } from '@tanstack/react-router';
import { useTabContext } from '../contexts/tab-context';

export const useOpenComic = () => {
  const navigate = useNavigate();
  const { openTab } = useTabContext();

  return (comic: Comic) => {
    openTab(comic);
    navigate({ to: '/viewer/$comicId', params: { comicId: String(comic.id) } });
  };
};
```

## Library Views

### 4. File Explorer View (`src/routes/library/index.tsx`)

A tree view that mirrors the filesystem structure based on indexed paths.

- Fetch all index paths and their comics
- Build a tree structure from comic paths relative to index base paths
- Render as an expandable/collapsible tree:
  - Folder nodes: click to expand/collapse, shows folder name
  - Leaf nodes (comics): rendered as a small card or list item

Create `src/components/file-tree.tsx`:
- Recursive tree component
- Each folder can be expanded/collapsed (tracked in local state)
- When a folder is expanded, show its children (subfolders or comics)
- Comics at leaf level show the cover thumbnail + title

Data structure:
```typescript
type TreeNode = {
  name: string;
  path: string;
  children: TreeNode[];
  comics: Comic[];
};
```

Build the tree by:
1. Getting all comics
2. For each comic, split its path relative to the index base path into segments
3. Insert into the tree structure

### 5. List View (`src/routes/library/list.tsx`)

A flat list/grid of all comics sorted alphabetically.

- Fetch all comics using `comicService.getAllComics()`
- Render using `ComicGrid`
- Add sort controls: by title, by artist, by date added, by view count
- Shows total count

### 6. Per-Artist View (`src/routes/library/artists.tsx`)

Comics grouped by artist.

- Fetch all comics
- Group by `artist` field (null artist grouped as "Unknown Artist")
- Render as collapsible sections:
  - Artist header with comic count
  - Expandable grid of comics for that artist
- Artists sorted alphabetically

Create `src/components/artist-group.tsx`:
```tsx
type ArtistGroupProps = {
  artist: string;
  comics: Comic[];
  onOpenComic: (comic: Comic) => void;
};
```

### 7. Favorites View (`src/routes/library/favorites.tsx`)

Two sections:
1. **Favorite Comics** — grid of comics where `is_favorite = 1`
2. **Favorite Images** — grid of individual favorited pages

For favorite images, show:
- The image thumbnail
- The parent comic title
- Page number
- Click to open that comic at that page

Create `src/components/favorite-image-card.tsx` for individual image cards.

### 8. Search View (`src/routes/library/search.tsx`)

Global search across comics.

- Search input at the top (auto-focus on mount)
- Searches by title, artist, series, issue
- Uses `comicService.searchComics(query)` which performs a SQL `LIKE` search
- Results displayed as `ComicGrid`
- Debounced input (300ms) to avoid excessive queries
- Shows "No results" message when empty
- Shows result count

Create `src/hooks/use-debounce.ts`:
```typescript
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};
```

## Data Loading

Each view should load data on mount. Use React `useEffect` + `useState` for data fetching (or a simple custom hook pattern):

```typescript
const useComics = () => {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    comicService.getAllComics().then(setComics).finally(() => setLoading(false));
  }, []);

  return { comics, loading };
};
```

Create reusable data hooks in `src/hooks/`:
- `use-comics.ts` — all comics
- `use-comics-by-artist.ts` — comics grouped by artist
- `use-favorite-comics.ts` — favorite comics
- `use-favorite-pages.ts` — favorite pages
- `use-search-comics.ts` — search with debounce

## Empty States

Each view should handle the empty state gracefully:
- No comics indexed: "No comics found. Configure indexing paths in Settings."
- No favorites: "No favorites yet. Star comics or images to see them here."
- No search results: "No comics match your search."

## Acceptance Criteria
- File explorer view shows comics in a tree structure matching the filesystem
- List view shows all comics in a sortable grid
- Per-artist view groups comics by artist with collapsible sections
- Favorites view shows favorited comics and individual images
- Search view allows searching by title/artist/series/issue with debounced input
- Clicking a comic opens it in the viewer (via tab system)
- All views show appropriate empty states
- Comic cards display cover images, titles, and metadata
