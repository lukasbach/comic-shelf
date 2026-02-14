# Task 12: Theme System & Final Integration

**Reference:** [requirements.md](../requirements.md)

## Objective
Implement the light/dark theme system, polish the UI with consistent Tailwind styling, ensure all components integrate correctly, and verify the complete app works end-to-end.

## Theme System

### 1. Tailwind CSS Dark Mode

Configure Tailwind for class-based dark mode. In Tailwind CSS v4, dark mode is handled via the `dark` variant using a class strategy.

Add to `src/index.css`:
```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

This allows using `dark:` prefix for dark mode styles, activated by the `dark` class on a parent element.

### 2. Theme Application

In `src/contexts/settings-context.tsx`, apply the theme class to the `<html>` element:

```typescript
useEffect(() => {
  const root = document.documentElement;
  if (settings.theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}, [settings.theme]);
```

### 3. Color Palette

Define a consistent color palette using Tailwind utility classes:

**Light mode** (default):
- Background: `bg-white` / `bg-gray-50` / `bg-gray-100`
- Text: `text-gray-900` / `text-gray-700` / `text-gray-500`
- Borders: `border-gray-200` / `border-gray-300`
- Primary accent: `bg-blue-600` / `text-blue-600`
- Interactive hover: `hover:bg-gray-100`
- Active/Selected: `bg-blue-50` / `border-blue-500`

**Dark mode** (with `dark:` prefix):
- Background: `dark:bg-gray-900` / `dark:bg-gray-800` / `dark:bg-gray-700`
- Text: `dark:text-gray-100` / `dark:text-gray-300` / `dark:text-gray-400`
- Borders: `dark:border-gray-600` / `dark:border-gray-700`
- Primary accent: `dark:bg-blue-500` / `dark:text-blue-400`
- Interactive hover: `dark:hover:bg-gray-700`
- Active/Selected: `dark:bg-blue-900/30` / `dark:border-blue-400`

### 4. Apply Theme Across All Components

Review and update all components from previous tasks to include dark mode variants:

**Top Bar** (`top-bar.tsx`):
```tsx
<header className="h-12 flex items-center px-4 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
```

**Tab Bar** (`tab-bar.tsx`):
- Active tab: `bg-white dark:bg-gray-800`
- Inactive tab: `bg-gray-100 dark:bg-gray-700`
- Tab text: `text-gray-700 dark:text-gray-300`

**Library Sidebar** (`library-sidebar.tsx`):
- Background: `bg-gray-50 dark:bg-gray-900`
- Active link: `bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`
- Inactive link: `text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800`

**Comic Cards** (`comic-card.tsx`):
- Card background: `bg-white dark:bg-gray-800`
- Card border: `border border-gray-200 dark:border-gray-700`
- Card shadow: `shadow-sm dark:shadow-gray-900/30`

**Viewer backgrounds** (all viewer modes):
- Main background: `bg-gray-100 dark:bg-gray-900`
- Sidebar: `bg-white dark:bg-gray-800`

**Settings page**:
- Input fields: `bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100`
- Section headers: `text-gray-900 dark:text-gray-100`

**Buttons**:
- Primary: `bg-blue-600 hover:bg-blue-700 text-white`
- Secondary: `bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200`
- Danger: `bg-red-600 hover:bg-red-700 text-white`

### 5. Theme Toggle in Settings

Ensure the theme toggle in settings is a simple radio button group or toggle switch that:
- Reads current value from `settings.theme`
- Updates via `setSetting('theme', newTheme)`
- Applies immediately (not just on save)

## Final Integration Checklist

### 6. End-to-End Flow Verification

Verify these flows work correctly:

1. **First Launch**: App opens → no comics → settings page → add index path → re-index → comics appear
2. **Browse Library**: Navigate between explorer/list/artist/favorites views
3. **Open Comic**: Click comic → tab opens → viewer loads → overview mode shows thumbnails
4. **View Modes**: Switch between overview ↔ single ↔ scroll — current page preserved
5. **Navigation**: Next/prev page buttons and hotkeys work in single page mode
6. **Zoom**: Zoom in/out with controls and hotkeys, image scales correctly
7. **Scroll Mode**: All pages render, lazy loading works, scroll tracker updates page
8. **Slideshow**: Toggle slideshow in single and scroll modes, auto-advance/scroll works
9. **Favorites**: Star comics and pages, see them in favorites view, unstar them
10. **View Counts**: Click counter, count increments, displays updated count
11. **Tabs**: Open multiple comics in tabs, switch between them, close tabs
12. **Hotkeys**: All configured hotkeys work, can be reconfigured in settings
13. **Theme**: Toggle light/dark, all components update correctly
14. **Breadcrumbs**: Show correct path in all views, segments are clickable

### 7. Responsive Layout

Ensure the app handles window resizing:
- Minimum window size: 800×600
- Sidebar collapses or overlays below ~1024px width
- Comic grid adjusts columns based on available width
- Viewer image scales correctly on resize

In `tauri.conf.json` or window settings, set minimum size:
```json
{
  "app": {
    "windows": [
      {
        "title": "Comic Viewer",
        "width": 1280,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600
      }
    ]
  }
}
```

### 8. Error Handling

Add global error handling:
- Database errors: Show toast notification with retry option
- File system errors: Handle missing files gracefully (show placeholder for broken images)
- Image loading errors: Show a fallback "broken image" placeholder

Create `src/components/error-boundary.tsx`:
- React error boundary wrapper
- Shows an error message with "Reload" button

Create `src/components/toast.tsx`:
- Simple toast notification system
- Auto-dismissing after 5 seconds
- Types: success, error, info

### 9. Window Title

Update the window title dynamically based on the current context:
- In library: "Comic Viewer"
- In viewer: "Comic Viewer — [Comic Title]"
- Update via `document.title`

### 10. Loading States

Ensure all async operations show loading states:
- Library views: Skeleton loader or spinner
- Viewer: Loading spinner while comic data loads
- Indexing: Progress bar
- Settings save: Button loading state

## Acceptance Criteria
- Light and dark themes work correctly across all components
- Theme persists across app restarts
- All integration flows (listed above) work end-to-end
- App handles window resizing gracefully
- Error states are handled with user-friendly messages
- Window title updates based on context
- All async operations show loading indicators
- The app is visually polished and consistent in both themes
