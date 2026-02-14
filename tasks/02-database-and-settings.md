# Task 2: Database Schema & Settings Infrastructure

**Reference:** [requirements.md](../requirements.md)

## Objective
Set up the SQLite database with Tauri SQL plugin (migrations, schema, service layer) and the Tauri Store plugin for persistent settings with sensible defaults.

## Database Schema

### Tables

#### `comics`
Stores indexed comic metadata.

```sql
CREATE TABLE comics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  artist TEXT,
  series TEXT,
  issue TEXT,
  cover_image_path TEXT,
  page_count INTEGER NOT NULL DEFAULT 0,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

#### `comic_pages`
Stores individual page info for each comic.

```sql
CREATE TABLE comic_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comic_id INTEGER NOT NULL,
  page_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  thumbnail_path TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
  UNIQUE(comic_id, page_number)
);
```

#### `index_paths`
Stores configured indexing paths with their pattern.

```sql
CREATE TABLE index_paths (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  pattern TEXT NOT NULL DEFAULT '{artist}/{series}/{issue}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Steps

### 1. Create Migrations in Rust

In `src-tauri/src/lib.rs`, define migrations and register them with the SQL plugin:

```rust
use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};

fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "
                CREATE TABLE IF NOT EXISTS comics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    path TEXT NOT NULL UNIQUE,
                    title TEXT NOT NULL,
                    artist TEXT,
                    series TEXT,
                    issue TEXT,
                    cover_image_path TEXT,
                    page_count INTEGER NOT NULL DEFAULT 0,
                    is_favorite INTEGER NOT NULL DEFAULT 0,
                    view_count INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS comic_pages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    comic_id INTEGER NOT NULL,
                    page_number INTEGER NOT NULL,
                    file_path TEXT NOT NULL,
                    file_name TEXT NOT NULL,
                    thumbnail_path TEXT,
                    is_favorite INTEGER NOT NULL DEFAULT 0,
                    view_count INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
                    UNIQUE(comic_id, page_number)
                );

                CREATE TABLE IF NOT EXISTS index_paths (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    path TEXT NOT NULL,
                    pattern TEXT NOT NULL DEFAULT '{artist}/{series}/{issue}',
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
            ",
            kind: MigrationKind::Up,
        },
    ]
}
```

Register migrations in the builder:
```rust
.plugin(
    SqlBuilder::default()
        .add_migrations("sqlite:comic-shelf.db", get_migrations())
        .build(),
)
```

Also preload the database in `tauri.conf.json`:
```json
{
  "plugins": {
    "sql": {
      "preload": ["sqlite:comic-shelf.db"]
    }
  }
}
```

### 2. Create TypeScript Database Service

Create `src/services/database.ts`:

```typescript
import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

const getDb = async (): Promise<Database> => {
  if (!db) {
    db = await Database.load('sqlite:comic-shelf.db');
  }
  return db;
};
```

Create dedicated service files for each entity:

**`src/services/comic-service.ts`** — CRUD operations for comics:
- `getAllComics(): Promise<Comic[]>`
- `getComicById(id: number): Promise<Comic | null>`
- `getComicsByArtist(artist: string): Promise<Comic[]>`
- `upsertComic(comic: Omit<Comic, 'id'>): Promise<number>`
- `deleteComic(id: number): Promise<void>`
- `toggleFavorite(id: number): Promise<void>`
- `incrementViewCount(id: number): Promise<void>`
- `getFavoriteComics(): Promise<Comic[]>`

**`src/services/comic-page-service.ts`** — CRUD for pages:
- `getPagesByComicId(comicId: number): Promise<ComicPage[]>`
- `insertPages(comicId: number, pages: Omit<ComicPage, 'id' | 'comic_id'>[]): Promise<void>`
- `updateThumbnailPath(id: number, thumbnailPath: string): Promise<void>`
- `togglePageFavorite(id: number): Promise<void>`
- `incrementPageViewCount(id: number): Promise<void>`
- `getFavoritePages(): Promise<ComicPage[]>`

**`src/services/index-path-service.ts`** — CRUD for index paths:
- `getAllIndexPaths(): Promise<IndexPath[]>`
- `addIndexPath(path: string, pattern: string): Promise<number>`
- `removeIndexPath(id: number): Promise<void>`

### 3. Create TypeScript Types

Create `src/types/comic.ts`:

```typescript
export type Comic = {
  id: number;
  path: string;
  title: string;
  artist: string | null;
  series: string | null;
  issue: string | null;
  cover_image_path: string | null;
  page_count: number;
  is_favorite: number; // SQLite boolean (0/1)
  view_count: number;
  created_at: string;
  updated_at: string;
};

export type ComicPage = {
  id: number;
  comic_id: number;
  page_number: number;
  file_path: string;
  file_name: string;
  thumbnail_path: string | null;
  is_favorite: number;
  view_count: number;
};

export type IndexPath = {
  id: number;
  path: string;
  pattern: string;
  created_at: string;
};
```

### 4. Set Up Tauri Store for Settings

Create `src/services/settings-service.ts`:

```typescript
import { load } from '@tauri-apps/plugin-store';

export type AppSettings = {
  hotkeys: {
    nextPage: string;
    prevPage: string;
    scrollUp: string;
    scrollDown: string;
    zoomIn: string;
    zoomOut: string;
    toggleSlideshow: string;
    toggleViewMode: string;
    closeTab: string;
    nextTab: string;
    prevTab: string;
  };
  defaultZoomLevel: number;       // percentage, e.g. 100
  defaultViewMode: 'single' | 'scroll' | 'overview';
  slideshowDelay: number;         // milliseconds
  theme: 'light' | 'dark';
};

const DEFAULT_SETTINGS: AppSettings = {
  hotkeys: {
    nextPage: 'ArrowRight',
    prevPage: 'ArrowLeft',
    scrollUp: 'ArrowUp',
    scrollDown: 'ArrowDown',
    zoomIn: '+',
    zoomOut: '-',
    toggleSlideshow: 's',
    toggleViewMode: 'v',
    closeTab: 'w',
    nextTab: 'ctrl+Tab',
    prevTab: 'ctrl+shift+Tab',
  },
  defaultZoomLevel: 100,
  defaultViewMode: 'single',
  slideshowDelay: 5000,
  theme: 'dark',
};
```

Provide methods:
- `loadSettings(): Promise<AppSettings>` — loads from store, merges with defaults
- `saveSettings(settings: AppSettings): Promise<void>`
- `getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]>`
- `setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void>`

Use `load('settings.json', { autoSave: 100 })` to create/load the store.

### 5. Create Settings React Context

Create `src/contexts/settings-context.tsx` that provides settings to the entire app via React Context. It should:
- Load settings on mount
- Provide current settings and an update function
- Apply theme class (`dark`/`light`) to the document root

## Acceptance Criteria
- Database is created on first launch with all tables
- All CRUD service functions are implemented and exported
- TypeScript types match database schema
- Settings store loads with defaults on first launch
- Settings can be read and written from the frontend
- Settings context is available app-wide
