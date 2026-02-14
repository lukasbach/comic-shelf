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

## Task 9: Slideshow Mode
- [x] Implement `useSlideshow` state management hook
- [x] Implement `useSlideshowScroll` for single-page auto-scroll
- [x] Implement `useAutoScroll` for scroll-mode continuous scrolling
- [x] Create `SlideshowIndicator` floating UI
- [x] Integrate slideshow into `SinglePageMode`, `ScrollMode`, and `ViewerHeader`
- [x] Verify implementation with unit tests

## Task 10: Favorites & View Counter System
- [x] Implement favorite toggle for comics and pages
- [x] Implement manual view counter increment for comics and pages
- [x] Create reusable `FavoriteButton` and `ViewCounter` components
- [x] Integrate favorite/view count UI into library cards and viewer modes
- [x] Update database services with toggle and increment operations
- [x] Verify implementation with unit tests

### Implementation Details

- **Favorites System**: Users can now favorite both entire comics and individual pages. The state is persisted in the SQLite database (`is_favorite` column).
- **View Counter**: Each comic and page has a `view_count` that increases only when the user manually clicks the view increment button ("eye + plus"). This allows users to track their reading history intentionally.
- **UI Components**:
  - `FavoriteButton`: A reusable animated star toggle.
  - `ViewCounter`: A badge showing the current count with a plus button to increment it, featuring a brief numeric animation on click.
- **Integration**:
  - **Library**: `ComicCard` features an overlay with favorite toggle and view counter.
  - **Viewer Header**: Displays comic-level favorites and view count.
  - **Overview Mode**: Each page thumbnail shows its favorite status and view count on hover, allowing quick interactions.
  - **Single Page Mode**: Navigation bar includes controls for the current page's favorite status and view count.
  - **Scroll Mode**: Each page features a floating favorite toggle visible on hover.
- **Optimistic UI**: All toggles and increments update the UI immediately and revert on service failure for a snappy user experience.
- **Data Consistency**: `useComicData` hook was enhanced to provide unified state management and update handlers for both comic and page metadata within the viewer.
- **Favorites View**: The existing Favorites view correctly aggregates all favorited comics and pages, with sorting by title and page number.

## Task 11: Settings & Hotkeys
- [x] Implement settings page with user preferences
- [x] Implement global hotkeys for navigation and controls
- [x] Implement theme switching (light/dark/system)
- [x] Verify implementation with unit tests

### Implementation Details
- **Settings Page**: Built using `@tanstack/react-form` for centralized state management. It features sections for General (theme, view mode), Slideshow (delay, auto-scroll), Hotkeys (customizable navigation, zoom, and tab controls), and Library (index path management).
- **Hotkey System**:
  - **Normalization**: Standardized keyboard event handling in `src/utils/hotkey-utils.ts` to support cross-OS modifiers.
  - **Recording**: Implemented a "Record" UI in `HotkeyInput` that captures and formats unique key combinations.
  - **Global Listener**: A global `useAppHotkeys` hook in `RootLayout` listens for keyboard events and maps them to app actions (Next/Prev Page, Zoom, Slideshow Toggle) based on the user's settings.
  - **Viewer Integration**: A `ViewerRefContext` provides a mechanism for the global hotkey hook to trigger scrolling within the dedicated viewer modes without deep prop drilling.
- **Theme Switching**: Supports Light, Dark, and System modes with automatic system preference tracking.
- **Persistence**: All settings are persisted to the filesystem using the Tauri Store plugin, with reactive updates across the application via `SettingsProvider`.
- **Slideshow Sync**: Slideshow state was promoted to the global tab state to allow hotkeys and UI components to stay in sync.

### Implementation Details
- **Slideshow Logic**: The slideshow system is split into multiple hooks. `useSlideshow` manages the high-level state (active, paused, progress) and is used in the main viewer route.
- **Single Page Mode**: When the slideshow is active in single-page mode, `useSlideshowScroll` handles the timing. If a page is zoomed in and taller than the viewport, it performs a linear auto-scroll to the bottom (taking up 90% of the delay) before advancing. If the page fits, it simply waits the full delay duration.
- **Scroll Mode**: In scroll mode, `useAutoScroll` calculates a constant scroll speed based on the number of pages and the slideshow delay. It continuously scrolls the entire comic and automatically resets to the top with a 1-second pause whenreaching the end.
- **UI Integration**: A "Slideshow" button was added to the `ViewerHeader`. When active, a floating `SlideshowIndicator` appears in the bottom-left corner with a progress bar (for single-page mode), status, and control buttons (Pause/Stop).
- **Smoothness**: All animations use `requestAnimationFrame` for high-performance, smooth linear motion.
- **Settings**: The system respects the `slideshowDelay` from the app settings.
- **Auto-Stop**: Slideshow automatically stops when switching to "Overview" mode.

### Implementation Details
- **Scroll Mode**: Implemented a continuous vertical scroll view for comics. All pages are stacked with a small gap, allowing for a seamless reading experience.
- **Efficient Rendering**: Used `IntersectionObserver` in the `LazyPage` component to only render images when they are near the viewport. This significantly improves performance for long comics and reduces memory usage.
- **Scroll Synchronization**: The `useScrollPageTracker` hook uses `IntersectionObserver` on each page to detect the most visible page and sync it back to the tab's `currentPage` state. This ensures that switching between modes or viewing the breadcrumbs/sidebar always reflects the user's current position.
- **Page Indicator**: A floating `ScrollPageIndicator` appears in the bottom-right corner during scrolling, showing "Page X / Y". It automatically fades out after 2 seconds of inactivity.
- **Initial Positioning**: When switching to Scroll Mode, the viewer automatically scrolls to the `currentPage` stored in the tab state, ensuring a smooth transition from other view modes.
- **Zoom Support**: Integrated with the existing zoom level from the tab state. Zoom levels > 100% enable horizontal scrolling within the viewer.
