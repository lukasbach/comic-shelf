# Comic Viewer Development Progress

## Task 1: Project Scaffolding
- [x] Initialize Tauri v2 project
- [x] Install frontend dependencies
- [x] Install Tauri plugins (Rust side)
- [x] Configure Tailwind CSS v4
- [x] Configure TanStack Router
- [x] Configure Tauri Permissions
- [x] Verify Build (Frontend only, Rust environment missing)

## Task 2: Database Schema & Settings Infrastructure
- [x] Configure SQL plugin and migrations in Rust
- [x] Configure tauri.conf.json for SQL preload
- [x] Create TypeScript types for comics and settings
- [x] Implement database services
- [x] Implement settings service and React context
- [x] Verify implementation with unit tests

## Task 3: App Shell, Layout & Tab System
- [x] Implement tab management system (store/context)
- [x] Define TanStack Router route structure
- [x] Create App Shell components (TopBar, TabBar, Breadcrumbs, LibrarySidebar)
- [x] Update root layout with navigation and tab display
- [x] Implement placeholder views for all routes
- [x] Implement draggable tab reordering
- [x] Verify implementation with unit tests

### Implementation Details

- **Tab Management**: A React Context (`TabProvider`) manages an array of `Tab` objects. Normal navigation updates the active tab's path. Middle-clicking creates a new tab. The tab system automatically syncs with the current route - the active tab always reflects the current pathname.
- **Tab Reordering**: Draggable tab reordering is implemented using `@dnd-kit`. Users can drag tabs to change their order, and this state is managed in the `TabProvider`. The `TabBar` uses `SortableContext` with a horizontal strategy.
- **Routing**: TanStack Router is configured with file-based routing.
  - `/` redirects to `/library`.
  - `/library` contains a `LibrarySidebar` and an `Outlet` for sub-routes (`/`, `/list`, `/artists`, etc.).
  - `/viewer/$comicId` renders the comic viewer.
  - `/settings` renders the settings page.
- **App Shell**: The `RootLayout` in `__root.tsx` wraps the app with `SettingsProvider` and `TabProvider`. It displays the `TopBar` (with breadcrumbs and settings) and the `TabBar` (when 2+ tabs are open).
- **Navigation**: Regular navigation (clicking links) updates the current tab. Middle-clicking opens a new tab. Breadcrumbs are dynamic and reflect the current route. The sidebar provides navigation between different library views. The currently displayed page is always represented by a tab, and the tab bar is only visible when multiple tabs exist.
- **Icons**: The application uses the Radix icon set from `react-icons/rx` for all UI elements.

## Task 4: Comic Indexing Engine
- [x] Implement path normalization and natural sort utilities
- [x] Implement thumbnail generation and caching service
- [x] Implement recursive directory scanning and pattern-based metadata extraction
- [x] Implement indexing service for database synchronization
- [x] Implement stale item removal and error handling during indexing
- [x] Implement global re-index orchestration
- [x] Create indexing context for state and progress tracking
- [x] Integrate automatic indexing trigger on app start
- [x] Verify implementation with unit tests

## Task 5: Comic Library Views
- [x] Implement Comic Card and Comic Grid components
- [x] Implement Comic Open Handler hook
- [x] Implement data loading hooks (`useComics`, `useSearchComics`, etc.)
- [x] Implement List View sorted by title, artist, date, etc.
- [x] Implement Per-Artist View with collapsible sections
- [x] Implement Search View with debounced input
- [x] Implement Favorites View for comics and individual images
- [x] Implement File Explorer View with tree structure
- [x] Verify implementation with unit tests

### Implementation Details

- **Comic Library Views**: All browsing views (Explorer, List, Artist, Favorites, Search) have been implemented using a shared `ComicGrid` and `ComicCard` component.
- **Data Loading**: Custom hooks were created for each view to handle data fetching from the `comicService`. All hooks support loading states and error/empty states.
- **Sorting & Search**: The List view supports sorting by title, artist, date added, and view count. The Search view uses a debounced input (300ms) to filter comics by title, artist, series, or issue.
- **Favorites**: The Favorites view displays both favorite comics and individual favorite pages. Clicking a favorite page opens the viewer at that specific page.
- **File Explorer**: A recursive `FileTree` component builds a filesystem-like structure based on indexed paths.
- **Performance**: The `Comic` type and `comicService` were updated to include a `thumbnail_path` from the first page of each comic, allowing for faster loading of covers in the library views without additional per-comic queries.
- **Navigation**: The `useOpenComic` and `useOpenComicPage` hooks integrate with the existing tab system to ensure the active tab is updated or a new tab is opened when a comic is selected.

### Implementation Details

- **Thumbnail Generation**: Thumbnails are generated using an off-screen `<canvas>` in the webview. They are saved as JPEG (80% quality) with a maximum dimension of 300px in the app data directory (`thumbnails/{comicId}/{pageNumber}.jpg`).
- **Caching**: The indexing engine checks the modification time (`mtime`) of source images and existing thumbnails. If the thumbnail is newer than the source image, generation is skipped.
- **Indexing Logic**:
  - `walkDirectory` recursively finds folders containing at least one image file. It now captures and reports errors during scanning.
  - `extractMetadata` maps folder structure to pattern variables (e.g., `{artist}/{series}`).
  - `indexComics` upserts comic data, generates thumbnails, and inserts page records. It handles per-item errors, skipping broken comics and logging them.
  - Stale comics (no longer on disk) and orphaned thumbnails are automatically removed during indexing.
- **Progress Tracking**: The `IndexingProvider` exports `isIndexing`, `progress`, and `errors` state. A new `IndexingStatus` component in the sidebar provides real-time feedback and error reporting.
- **Utilities**: `getImageUrl` in `src/utils/image-utils.ts` handles the conversion of native file paths to Tauri asset URLs.

## Task 6: Comic Viewer â€” Overview Mode
- [x] Implement `useComicData` hook for loading comic and pages
- [x] Create Viewer UI components (Header, Grid, Page Thumbnail)
- [x] Implement Overview Mode responsive grid
- [x] Integrate mode switching logic in viewer route
- [x] Implement loading and error (not found) states
- [x] Verify implementation with unit tests

### Implementation Details

- **Comic Viewer**: The viewer is located at `/viewer/$comicId`. It uses the `useComicData` hook to fetch both comic metadata and the full list of pages.
- **Overview Mode**: This is the default view mode. it displays a responsive grid of page thumbnails.
  - Thumbnails use the pre-generated thumbnail images for performance, falling back to original images if needed.
  - Each thumbnail displays the page number and a favorite star if applicable.
  - Clicking a thumbnail updates the `currentPage` in the tab state and switches the `viewMode` to `single` (implemented as a placeholder for now).
- **Viewer Header**: A dedicated toolbar below the main top bar allows switching between `overview`, `single`, and `scroll` modes. It also displays the comic title and page count.
- **State Management**: The viewer relies on the `TabProvider` (`useTabs` hook) to persist and manage the current mode and page per tab.
- **Placeholders**: While Task 6 focuses on Overview mode, placeholders for `SinglePageMode` and `ScrollMode` have been added to ensure a functional mode-switching UI.

## Task 7: Comic Viewer â€” Single Page Mode
- [x] Implement `usePreloadImages` hook for preloading adjacent pages
- [x] Create `PageImage` component with zoom and fit-width logic
- [x] Create `PageNavigation` component for manual page switching and jumps
- [x] Create `ViewerSidebar` with thumbnails, zoom slider, and display controls
- [x] Implement `SinglePageMode` layout and state integration
- [x] Update tab management and viewer route to support single page mode
- [x] Verify implementation with unit tests

### Implementation Details
- **Single Page Mode**: Implemented the single page mode with navigation, zoom, and sidebar thumbnails.
- **Preloading**: Added `usePreloadImages` hook to preload the next few pages for smoother navigation.
- **Zoom**: Supported zoom levels from 50% to 300%, with "Fit Width" as the default (100%).
- **Sidebar**: Added a collapsible sidebar with view mode switching, zoom controls, and upcoming page thumbnails.
- **Navigation**: Integrated with the tab system to persist current page and zoom level per tab. Added jump-to-page functionality by clicking the page number.
- **Inconsistencies Fixed**: Standardized `currentPage` to be 0-indexed across the viewer components to simplify array access.

## Task 8: Comic Viewer  Scroll Mode
- [x] Implement `useScrollPageTracker` hook for scroll synchronization
- [x] Create `LazyPage` component for efficient rendering
- [x] Create `ScrollPageIndicator` floating element
- [x] Implement `ScrollMode` layout and integration
- [x] Verify implementation with unit tests

### Implementation Details
- **Scroll Mode**: Implemented a continuous vertical scroll view for comics. All pages are stacked with a small gap, allowing for a seamless reading experience.
- **Efficient Rendering**: Used `IntersectionObserver` in the `LazyPage` component to only render images when they are near the viewport. This significantly improves performance for long comics and reduces memory usage.
- **Scroll Synchronization**: The `useScrollPageTracker` hook uses `IntersectionObserver` on each page to detect the most visible page and sync it back to the tab's `currentPage` state. This ensures that switching between modes or viewing the breadcrumbs/sidebar always reflects the user's current position.
- **Page Indicator**: A floating `ScrollPageIndicator` appears in the bottom-right corner during scrolling, showing "Page X / Y". It automatically fades out after 2 seconds of inactivity.
- **Initial Positioning**: When switching to Scroll Mode, the viewer automatically scrolls to the `currentPage` stored in the tab state, ensuring a smooth transition from other view modes.
- **Zoom Support**: Integrated with the existing zoom level from the tab state. Zoom levels > 100% enable horizontal scrolling within the viewer.
