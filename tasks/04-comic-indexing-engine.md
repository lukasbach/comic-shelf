# Task 4: Comic Indexing Engine

**Reference:** [requirements.md](../requirements.md)

## Objective
Implement the comic indexing engine that recursively scans configured directories, parses folder structures using configurable patterns (e.g. `{artist}/{series}/{issue}`), and populates the database with comic and page data.

## How Indexing Works

The user configures a path pattern like:
```
C:/Comics/{artist}/{series}/{issue}
```

The indexing engine:
1. Reads the base path (`C:/Comics/`)
2. Recursively walks directories
3. Identifies folders containing image files (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`) as comics
4. Matches the folder's relative path against the pattern to extract metadata (artist, series, issue)
5. Sorts image files naturally (alphabetical/numeric) to determine page order
6. Uses the first image (by sort order) as the cover
7. Generates thumbnails for each page image and caches them in the app data directory
8. Upserts comic and page records into the database (including thumbnail paths)

### Pattern Parsing

Given pattern `{artist}/{series}/{issue}` and base path `C:/Comics/`:
- `C:/Comics/ArtistName/MySeries/Chapter01/` → artist="ArtistName", series="MySeries", issue="Chapter01"
- `C:/Comics/ArtistName/MySeries/` → artist="ArtistName", series="MySeries", issue=null (if this folder contains images)

The pattern variables are optional and positional. If a comic folder is at a shallower depth than the pattern, unfilled variables are null. If deeper, extra path segments are ignored for metadata but the comic is still indexed.

## Implementation

### 1. Indexing Service

Create `src/services/indexing-service.ts`:

```typescript
import { readDir } from '@tauri-apps/plugin-fs';
import * as path from '@tauri-apps/api/path';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

type IndexedComic = {
  path: string;
  title: string;
  artist: string | null;
  series: string | null;
  issue: string | null;
  coverImagePath: string;
  pages: { filePath: string; fileName: string; pageNumber: number; thumbnailPath: string }[];
};
```

Key functions:

**`parsePattern(pattern: string): string[]`**
Extracts variable names from the pattern. E.g., `{artist}/{series}/{issue}` → `['artist', 'series', 'issue']`.

**`extractMetadata(relativePath: string, patternVars: string[]): Record<string, string | null>`**
Splits the relative path by `/` and maps each segment to the corresponding pattern variable. Returns an object like `{ artist: "X", series: "Y", issue: "Z" }`.

**`isImageFile(fileName: string): boolean`**
Checks if the file extension is in `IMAGE_EXTENSIONS`.

**`naturalSort(files: string[]): string[]`**
Sorts file names using natural sort order (so `page2.jpg` comes before `page10.jpg`). Implement a simple natural sort comparator that splits strings into numeric and non-numeric parts.

**`scanDirectory(basePath: string, pattern: string): Promise<IndexedComic[]>`**
The main indexing function:
1. Parse the pattern into variable names
2. Use `readDir` from `@tauri-apps/plugin-fs` to recursively read directories
3. For each directory that contains image files, create an `IndexedComic`
4. Extract metadata by computing the relative path from basePath and matching against pattern variables
5. Sort images naturally for page ordering
6. Set the first image as cover

Important: Use `readDir` recursively. The Tauri FS plugin's `readDir` returns entries with `name` and `isDirectory` / `isFile` properties. You need to recurse manually:

```typescript
import { readDir, DirEntry } from '@tauri-apps/plugin-fs';

const walkDirectory = async (dirPath: string): Promise<{ dirs: string[]; files: string[] }> => {
  const entries = await readDir(dirPath);
  const files: string[] = [];
  const dirs: string[] = [];
  
  for (const entry of entries) {
    const fullPath = await path.join(dirPath, entry.name);
    if (entry.isDirectory) {
      dirs.push(fullPath);
    } else if (entry.isFile && isImageFile(entry.name)) {
      files.push(fullPath);
    }
  }
  
  return { dirs, files };
};
```

**`indexComics(indexPathId: number, basePath: string, pattern: string): Promise<void>`**
Orchestrator function:
1. Calls `scanDirectory` to get all comics
2. For each comic, generates thumbnails via `thumbnailService.generateThumbnails`
3. Upserts comic into the database using `comic-service.upsertComic`
4. Inserts pages (with thumbnail paths) using `comic-page-service.insertPages`
5. Removes comics from DB that no longer exist on disk
6. Cleans up orphaned thumbnails via `thumbnailService.cleanupOrphans`

### 2. Re-index Logic

Create `src/services/reindex-service.ts`:

**`reindexAll(): Promise<void>`**
- Loads all index paths from the database
- Calls `indexComics` for each
- Reports progress via a callback or state

**`reindexPath(indexPathId: number): Promise<void>`**
- Re-indexes a single configured path

### 3. Indexing State & Progress

Create `src/contexts/indexing-context.tsx`:

Provides:
- `isIndexing: boolean`
- `progress: { current: number; total: number; currentPath: string } | null`
- `startIndexing(): Promise<void>` — triggers full re-index
- `lastIndexedAt: string | null`

The context uses React state and wraps the indexing service calls.

### 4. Initial Indexing Trigger

When the app starts and index paths are configured, automatically trigger indexing. Add a `useEffect` in the root layout or settings provider that calls `reindexAll()` on mount (but only if index paths exist).

### 5. File Path Handling

Tauri uses platform-native paths. On Windows, paths use `\` separators. Normalize all paths to use `/` for consistency in the database and pattern matching. Use `@tauri-apps/api/path` for path operations:

```typescript
import { join, sep } from '@tauri-apps/api/path';

const normalizePath = (p: string): string => p.replace(/\\/g, '/');
```

### 6. Thumbnail Caching Service

Create `src/services/thumbnail-service.ts`:

Thumbnails are generated during indexing and stored in the Tauri app data directory under a `thumbnails/` subfolder. This avoids re-loading and re-scaling full-resolution images for grids, overviews, and sidebars.

```typescript
import { readFile, writeFile, exists, mkdir, remove } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
```

Key functions:

**`getThumbnailDir(): Promise<string>`**
Returns the path to the thumbnails directory (`{appDataDir}/thumbnails/`). Creates it if it doesn't exist.

**`generateThumbnail(sourceImagePath: string, comicId: string, pageNumber: number): Promise<string>`**
Generates a thumbnail for a single image:
1. Determine the output path: `{thumbnailDir}/{comicId}/{pageNumber}.jpg`
2. Create the comic's thumbnail subdirectory if it doesn't exist
3. If the thumbnail already exists and the source file hasn't changed (compare by mtime or file size), skip generation (cache hit)
4. Load the source image into an off-screen `<canvas>` via an `Image` element
5. Scale down to a max dimension of **300px** (width or height, preserving aspect ratio)
6. Export as JPEG at **80% quality** (`canvas.toBlob('image/jpeg', 0.8)`)
7. Write the blob to the output path using `writeFile`
8. Return the absolute thumbnail path

Canvas-based thumbnail generation:
```typescript
const generateThumbnailBlob = (sourceUrl: string, maxSize = 300): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
        'image/jpeg',
        0.8
      );
    };
    img.onerror = reject;
    img.src = sourceUrl;
  });
};
```

**`generateThumbnails(comic: IndexedComic, comicId: string): Promise<string[]>`**
Generates thumbnails for all pages of a comic. Returns an array of thumbnail file paths (one per page). Processes pages sequentially to avoid memory spikes, or in small batches (e.g., 5 at a time).

**`deleteThumbnailsForComic(comicId: string): Promise<void>`**
Removes the entire thumbnail subdirectory for a comic (used during re-indexing when a comic is removed).

**`cleanupOrphans(activeComicIds: string[]): Promise<void>`**
Scans the thumbnails directory and removes subdirectories for comics that are no longer in the database.

**`getThumbnailUrl(thumbnailPath: string): string`**
Converts a thumbnail file path to a displayable URL using `convertFileSrc` (same as `getImageUrl`).

Notes:
- Thumbnail generation uses the browser's `<canvas>` API which is available in the Tauri webview
- The source image is loaded via `convertFileSrc()` (asset protocol) for the `Image` element
- Writing the output uses `writeFile` from `@tauri-apps/plugin-fs` — convert the Blob to a `Uint8Array` first:
```typescript
const blobToUint8Array = async (blob: Blob): Promise<Uint8Array> => {
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
};
```
- The `writeFile` permission must be added in task 1's capability config: add `"fs:allow-write-file"` and `"fs:allow-mkdir"` and `"fs:allow-exists"` and `"fs:allow-remove"`

### 7. Image Display

To display local images in the Tauri webview, use the asset protocol. Convert file paths to asset URLs:

```typescript
import { convertFileSrc } from '@tauri-apps/api/core';

const imageUrl = convertFileSrc(absoluteFilePath);
// Use this URL in <img src={imageUrl} />
```

This is critical — you cannot use `file://` directly in the webview. The `convertFileSrc` function converts to the Tauri asset protocol (`asset://` or `https://asset.localhost/`).

Make sure the CSP in `tauri.conf.json` allows `asset:` and `http://asset.localhost` in `img-src`:
```json
"security": {
  "csp": "default-src 'self'; img-src 'self' asset: http://asset.localhost; style-src 'self' 'unsafe-inline'"
}
```

Provide a utility function in `src/utils/image-utils.ts`:
```typescript
import { convertFileSrc } from '@tauri-apps/api/core';

export const getImageUrl = (filePath: string): string => convertFileSrc(filePath);
```

## Acceptance Criteria
- Indexing engine scans directories and finds comics (folders with images)
- Pattern parsing correctly extracts artist/series/issue from directory structure
- Images are sorted naturally (page2 before page10)
- Comics and pages are stored in the database
- **Thumbnails are generated for every page and stored in `{appDataDir}/thumbnails/{comicId}/`**
- **Thumbnails are max 300px (longest side), JPEG at 80% quality**
- **Existing thumbnails are skipped during re-indexing (cache hit)**
- **Orphaned thumbnails are cleaned up when comics are removed**
- Re-indexing removes stale entries
- Indexing progress is trackable
- `getImageUrl()` utility converts file paths for display in `<img>` tags
- Works with Windows paths (backslash handling)
