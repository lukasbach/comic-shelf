# Task 11: Settings Page & Hotkey System

**Reference:** [requirements.md](../requirements.md)

## Objective
Build the settings page using TanStack Form for all configurable options, and implement the hotkey system using TanStack Hotkeys for keyboard shortcuts throughout the app.

## Settings Page

### Route: `src/routes/settings/index.tsx`

The settings page is a full-page form organized in sections.

### 1. Settings Form with TanStack Form

Use `@tanstack/react-form` to build the settings form.

```tsx
import { useForm } from '@tanstack/react-form'
```

TanStack Form usage pattern:
```tsx
const form = useForm({
  defaultValues: currentSettings, // loaded from settings service
  onSubmit: async ({ value }) => {
    await saveSettings(value);
    // Show success notification
  },
});
```

Field rendering pattern (from TanStack Form docs):
```tsx
<form.Field name="defaultZoomLevel">
  {(field) => (
    <div>
      <label htmlFor={field.name}>Default Zoom Level</label>
      <input
        id={field.name}
        type="number"
        value={field.state.value}
        onChange={(e) => field.handleChange(Number(e.target.value))}
      />
    </div>
  )}
</form.Field>
```

### 2. Settings Sections

#### General Settings
- **Theme**: Toggle between light and dark mode
  - Radio buttons or toggle switch
  - Options: `light` | `dark`
- **Default View Mode**: What mode comics open in
  - Radio buttons: Overview | Single Page | Scroll
- **Default Zoom Level**: Default zoom when opening a comic
  - Numeric input (50-300) with a slider

#### Slideshow Settings
- **Slideshow Delay**: Time between auto-advance in milliseconds
  - Numeric input with presets (3000, 5000, 8000, 10000)
  - Show as seconds in the UI label (e.g., "5 seconds")

#### Hotkey Settings
- Each hotkey is a configurable input
- List all hotkeys with their current binding
- Each hotkey has a "Record" button that listens for the next keypress and captures it
- Display format: human-readable key names (e.g., "Ctrl + Tab", "ArrowRight")

Hotkeys to configure:
| Action | Default | Setting Key |
|--------|---------|------------|
| Next Page | ArrowRight | `hotkeys.nextPage` |
| Previous Page | ArrowLeft | `hotkeys.prevPage` |
| Scroll Up | ArrowUp | `hotkeys.scrollUp` |
| Scroll Down | ArrowDown | `hotkeys.scrollDown` |
| Zoom In | + | `hotkeys.zoomIn` |
| Zoom Out | - | `hotkeys.zoomOut` |
| Toggle Slideshow | s | `hotkeys.toggleSlideshow` |
| Toggle View Mode | v | `hotkeys.toggleViewMode` |
| Close Tab | w | `hotkeys.closeTab` |
| Next Tab | Ctrl+Tab | `hotkeys.nextTab` |
| Previous Tab | Ctrl+Shift+Tab | `hotkeys.prevTab` |

#### Indexing Settings
- **Index Paths**: List of configured paths with their patterns
- Each entry shows:
  - Path (text input or folder picker)
  - Pattern (text input, default: `{artist}/{series}/{issue}`)
  - Remove button
- "Add Path" button:
  - Opens the Tauri folder dialog to select a directory
  - Adds the path with the default pattern

```typescript
import { open } from '@tauri-apps/plugin-dialog';

const selectFolder = async () => {
  const selected = await open({ directory: true, multiple: false });
  if (selected) {
    await indexPathService.addIndexPath(selected as string, '{artist}/{series}/{issue}');
    // Refresh the list
  }
};
```

- **Re-index Button**: Triggers a full re-index of all paths
  - Shows progress indicator while indexing
  - Disabled while indexing is in progress

### 3. Hotkey Record Component

Create `src/components/settings/hotkey-input.tsx`:

```tsx
type HotkeyInputProps = {
  value: string;
  onChange: (newKey: string) => void;
  label: string;
};
```

Features:
- Displays the current key binding
- "Record" button enters recording mode
- In recording mode:
  - The input shows "Press a key..."
  - Listens for `keydown` event on the window
  - Captures the key combination (including modifiers: Ctrl, Shift, Alt)
  - Formats it as a string: e.g., `ctrl+shift+Tab`
  - Stops recording after capture
  - "Cancel" button to exit recording mode without changing
- Prevent duplicate hotkey assignments (show warning)

Key capture logic:
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('ctrl');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  if (e.metaKey) parts.push('meta');
  
  // Don't record modifier-only presses
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
    parts.push(e.key);
    onChange(parts.join('+'));
    setRecording(false);
  }
};
```

### 4. Form Actions

- **Save button**: Submits the form, saves all settings via `settingsService.saveSettings()`
- **Reset to Defaults button**: Resets all settings to defaults
- **Cancel button**: Navigates back to the previous page without saving

## Hotkey System

### 5. TanStack Hotkeys Integration

Use `@tanstack/react-hotkeys` (or the appropriate TanStack hotkey library) throughout the app.

Note: If `@tanstack/react-hotkeys` is not available or has a different API, use a custom implementation with `useEffect` + `keydown` event listeners. The key mapping comes from settings.

Create `src/hooks/use-app-hotkeys.ts`:

```typescript
export const useAppHotkeys = () => {
  const { settings } = useSettings();
  const { activeTabId, tabs, updateTab, closeTab, nextTab, prevTab } = useTabContext();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = formatKeyEvent(e); // Convert event to our key format
      const activeTab = tabs.find(t => t.id === activeTabId);

      // Don't handle hotkeys when in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const hotkeys = settings.hotkeys;

      if (key === hotkeys.nextPage) {
        e.preventDefault();
        // advance page logic
      } else if (key === hotkeys.prevPage) {
        e.preventDefault();
        // previous page logic
      } else if (key === hotkeys.zoomIn) {
        e.preventDefault();
        if (activeTab) {
          updateTab(activeTab.id, { zoomLevel: activeTab.zoomLevel + 10 });
        }
      } else if (key === hotkeys.zoomOut) {
        e.preventDefault();
        if (activeTab) {
          updateTab(activeTab.id, { zoomLevel: Math.max(10, activeTab.zoomLevel - 10) });
        }
      } else if (key === hotkeys.toggleSlideshow) {
        e.preventDefault();
        // Toggle slideshow
      } else if (key === hotkeys.toggleViewMode) {
        e.preventDefault();
        // Cycle: overview → single → scroll → overview
      } else if (key === hotkeys.closeTab) {
        e.preventDefault();
        if (activeTabId) closeTab(activeTabId);
      } else if (key === hotkeys.nextTab) {
        e.preventDefault();
        nextTab();
      } else if (key === hotkeys.prevTab) {
        e.preventDefault();
        prevTab();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings, activeTabId, tabs]);
};
```

The `formatKeyEvent` helper:
```typescript
const formatKeyEvent = (e: KeyboardEvent): string => {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('ctrl');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  if (e.metaKey) parts.push('meta');
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
    parts.push(e.key);
  }
  return parts.join('+');
};
```

### 6. Hotkey Registration

Call `useAppHotkeys()` in the root layout (`__root.tsx`) so hotkeys are globally active.

### 7. Scroll Up/Down Hotkeys

For scroll up/down, scroll the appropriate container:
- In single-page mode: scroll the image container
- In scroll mode: scroll the main scroll container
- Amount: ~100px per press, or use smooth scrolling

This requires the viewer components to expose or share their scroll container refs. Use a ref context:

Create `src/contexts/viewer-ref-context.tsx`:
```typescript
export const ViewerRefContext = createContext<{
  scrollContainerRef: RefObject<HTMLDivElement> | null;
}>({ scrollContainerRef: null });
```

Set the ref in SinglePageMode and ScrollMode, consume in the hotkey handler.

## Acceptance Criteria
- Settings page renders with all sections (General, Slideshow, Hotkeys, Indexing)
- All settings can be modified and saved persistently via Tauri Store
- Hotkey inputs support key recording with modifier keys
- Duplicate hotkey assignments show a warning
- Reset to defaults works correctly
- Indexing paths can be added (with folder picker dialog) and removed
- Re-index button triggers full re-indexing with progress
- All configured hotkeys work throughout the app
- Hotkeys are disabled when typing in input fields
- Tab navigation hotkeys (Ctrl+Tab) work correctly
- Zoom in/out hotkeys adjust the active tab's zoom level
- View mode toggle cycles through overview → single → scroll
