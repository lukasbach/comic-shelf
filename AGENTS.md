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
- [x] Verify implementation with unit tests

### Implementation Details

- **Tab Management**: A React Context (`TabProvider`) manages an array of `Tab` objects. Normal navigation updates the active tab's path. Middle-clicking creates a new tab. The tab system automatically syncs with the current route - the active tab always reflects the current pathname.
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
- [x] Implement global re-index orchestration
- [x] Create indexing context for state and progress tracking
- [x] Integrate automatic indexing trigger on app start
- [x] Verify implementation with unit tests

### Implementation Details

- **Thumbnail Generation**: Thumbnails are generated using an off-screen `<canvas>` in the webview. They are saved as JPEG (80% quality) with a maximum dimension of 300px in the app data directory (`thumbnails/{comicId}/{pageNumber}.jpg`).
- **Caching**: The indexing engine checks the modification time (`mtime`) of source images and existing thumbnails. If the thumbnail is newer than the source image, generation is skipped.
- **Indexing Logic**:
  - `walkDirectory` recursively finds folders containing at least one image file.
  - `extractMetadata` maps folder structure to pattern variables (e.g., `{artist}/{series}`).
  - `indexComics` upserts comic data, generates thumbnails, and inserts page records.
  - Stale comics (no longer on disk) and orphaned thumbnails are automatically removed during indexing.
- **Progress Tracking**: The `IndexingProvider` exports `isIndexing` and `progress` state, which includes the current path being processed and overall counts across multiple index paths.
- **Utilities**: `getImageUrl` in `src/utils/image-utils.ts` handles the conversion of native file paths to Tauri asset URLs.
