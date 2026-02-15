# Comic Shelf App

The app is a local desktop app that indexes locally stored comics and allows users to view them. The user can configure which folders to index, and all nested folders with image files inside will be considered a comic book. There are a number of displaying options the user can configure.

## Functional Requirements

### Indexing and listing comics

The user can configure something like "path/to/comics/{artist}/{series}/{issue}" as the path to index. The app will then recursively look for image files in the specified path and consider each folder with image files as a comic book.

The app will allow the user to display available comics either in a file explorer view (where folders are mapped as is from the file system), in a list view with all comics, and a "per-artist" view where comics are grouped by artist.

The first image is also used as comic cover.

There is also a global search option.

### Comic managing

The user can favorite comics and individual images. There are ways to display all favoritate comics and images.

There is also a "viewed" counter for each comic and image (seperately). It is only incremented if the user clicks on the counter button, on each image/comic.

### Viewing comics

There are several ways to view comics:

- Overview: Each page is shown as thumbnail in a grid view. The user can click on a thumbnail to jump to that page.
- Single page: The user can view one page at a time. The page is either scaled to fit the width of the window, or shown in a configurable zoom level. The user can navigate to the next/previous page using buttons or keyboard shortcuts. A sidebar contains thumbnails of the next few images, controls for navigation and display settings. 
  - There also exists a "slideshow mode" where the user can configure a delay between pages, and the app will automatically navigate to the next page after the delay. During that delay, if the page is zoomed in, the page slowly and linearly scrolls down to the bottom of the page.
- Scroll: All pages are rendered below each other, and the user can scroll through them. The pages are either scaled to fit the width of the window, or shown in a configurable zoom level. There is a slideshow mode that slowly automatically scrolls down the page, and at the end it automatically scrolls back to the top and starts again.

In the topbar, there are always breadcrumbs showing the current comic and page, as well as the path to that comic. The user can click on the breadcrumbs to jump to the overview or the list of comics.

### Tabs

The user can open multiple comics at the same time, and each comic is shown in a separate tab. The user can switch between tabs to view different comics.

### Hotkeys

The app supports hotkeys for navigation and display settings. Each hotkey can be configured in the application settings.

- Next/previous page: Right/left arrow keys
- Scroll up/down: Up/down arrow keys
- Zoom in/out: "+"/"-" keys
- Toggle slideshow mode: "S" key
- Toggle between single page and scroll view: "V" key
- Close current tab: "W" key
- Switch to next/previous tab: "Ctrl + Tab"/"Ctrl + Shift + Tab" keys

### Settings

There is a dedicated settings page where hotkeys and other settings are configured. The settings are saved and loaded on app startup.
They include:

- Hotkeys
- Default zoom level
- Default view mode (single page, scroll, overview)
- Slideshow delay
- Indexing settings
- Theme (light/dark)

## Tech Stack

- Frontend with React and TypeScript
- Desktop app with Tauri
- Database with the SQL extension of Tauri (SQLite)
- Settings stored in the Tauri Store extension
- Tanstack Hotkeys for hotkey management
- Tanstack Router for routing
- Tanstack Form for forms in the settings page
- Tailwind CSS for styling
- Vitest for testing, and ESLint with prettier for linting and formatting