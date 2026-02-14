# Task 3: App Shell, Layout & Tab System

**Reference:** [requirements.md](../requirements.md)

## Objective
Build the main application shell including the top bar with breadcrumbs and tabs, a sidebar for navigation, and the routing structure. Implement a tab management system for opening multiple comics simultaneously.

## Route Structure

Using TanStack Router file-based routing, define the following routes:

```
src/routes/
  __root.tsx          → App shell (top bar, sidebar, tabs, outlet)
  index.tsx           → Redirect to /library
  library/
    route.tsx         → Library layout (wraps sub-routes)
    index.tsx         → Default library view (file explorer)
    list.tsx          → Flat list view
    artists.tsx       → Per-artist grouped view
    favorites.tsx     → Favorite comics and images
  viewer/
    $comicId.tsx      → Comic viewer (handles overview/single/scroll modes)
  settings/
    index.tsx         → Settings page
```

## Components

### 1. App Shell (`src/routes/__root.tsx`)

The root layout that wraps all pages. Structure:

```
┌──────────────────────────────────────────────┐
│ TopBar: [Breadcrumbs]            [Settings]  │
│ TabBar: [Tab1] [Tab2] [Tab3+]                │
├──────────────────────────────────────────────┤
│                                              │
│              <Outlet />                      │
│                                              │
└──────────────────────────────────────────────┘
```

- The top bar shows breadcrumbs based on the current route/comic context
- The tab bar is only visible when at least one comic is open
- The settings icon navigates to `/settings`
- Wrap with the SettingsProvider from task 2

### 2. Tab Management

Create `src/stores/tab-store.ts` using a simple React context + state approach (or a lightweight store like zustand — but prefer plain context for simplicity):

```typescript
export type Tab = {
  id: string;           // unique ID
  comicId: number;      // database comic ID
  title: string;        // display name
  currentPage: number;  // last viewed page
  viewMode: 'overview' | 'single' | 'scroll';
  zoomLevel: number;
};
```

Provide:
- `tabs: Tab[]` — list of open tabs
- `activeTabId: string | null` — currently active tab
- `openTab(comic: Comic): void` — opens a new tab or focuses existing one for the same comic
- `closeTab(tabId: string): void` — closes tab, switches to adjacent
- `setActiveTab(tabId: string): void` — switches to a tab
- `updateTab(tabId: string, updates: Partial<Tab>): void` — updates tab state (page, zoom, mode)
- `nextTab(): void` — switch to the next tab
- `prevTab(): void` — switch to the previous tab

Create `src/contexts/tab-context.tsx` to provide this as a React context.

### 3. Tab Bar Component

Create `src/components/tab-bar.tsx`:

- Renders a horizontal list of tabs
- Each tab shows the comic title and a close button (×)
- Active tab is visually highlighted
- Clicking a tab navigates to `/viewer/$comicId` and sets it active
- When closing a tab, if it's the active one, activate the adjacent tab. If no tabs remain, navigate to `/library`

Styling with Tailwind CSS:
- Tabs use `flex` layout, truncated text for long titles
- Active tab has a distinct background/border
- Close button appears on hover

### 4. Breadcrumb Bar Component

Create `src/components/breadcrumb-bar.tsx`:

- Uses the current route and tab context to build breadcrumbs
- In library views: `Library > [View Name]`
- In viewer: `Library > [Artist] > [Series] > [Issue] > Page [N]`
- Each segment is clickable and navigates to the appropriate route/view
- Use `<Link>` from TanStack Router for navigation

### 5. Top Bar Component

Create `src/components/top-bar.tsx`:

- Contains the BreadcrumbBar on the left
- Settings gear icon on the right (navigates to `/settings`)
- Fixed at the top of the window

### 6. Sidebar Component (Library)

Create `src/components/library-sidebar.tsx`:

- Navigation links for library views:
  - 📁 Explorer (file tree view)
  - 📋 All Comics (flat list)
  - 👤 By Artist (grouped view)
  - ⭐ Favorites
- Active link is highlighted
- Collapsible on smaller widths

## Technical Notes

### TanStack Router Navigation
When opening a comic from the library, use:
```tsx
import { useNavigate } from '@tanstack/react-router'
const navigate = useNavigate()
navigate({ to: '/viewer/$comicId', params: { comicId: String(comic.id) } })
```

### Tab Persistence
Tabs are in-memory only (not persisted to store). They are lost on app restart. This is intentional.

### Layout Composition
The root route should wrap children in the consistent layout. Library routes get the sidebar; viewer routes get the viewer sidebar (created in a later task). Use route layouts to differentiate:

- `__root.tsx` renders TopBar + TabBar + Outlet
- `library/route.tsx` renders LibrarySidebar + Outlet
- `viewer/$comicId.tsx` renders its own content (viewer sidebar is part of the viewer)

## Acceptance Criteria
- App shell renders with top bar, tab bar, and outlet
- Tab system allows opening, closing, switching tabs
- Breadcrumbs reflect current navigation context
- Library sidebar navigates between library views
- Route structure is in place with placeholder content for all routes
- Settings route navigates to a placeholder settings page
