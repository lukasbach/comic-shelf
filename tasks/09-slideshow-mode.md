# Task 9: Slideshow Mode

**Reference:** [requirements.md](../requirements.md)

## Objective
Implement slideshow mode for both single-page and scroll viewing modes. In single-page mode, the slideshow auto-advances pages with an optional slow scroll for zoomed pages. In scroll mode, the slideshow continuously auto-scrolls.

## Slideshow Behavior by View Mode

### Single Page Mode Slideshow
1. After the configured delay (default 5000ms from settings), advance to the next page
2. If the current page is zoomed in (zoomLevel > 100) and the image is taller than the viewport:
   - During the delay period, slowly and linearly scroll from top to bottom of the page
   - When the scroll reaches the bottom, wait briefly, then advance to the next page
3. At the last page, stop the slideshow (or optionally loop — make this configurable)

### Scroll Mode Slideshow
1. Automatically scrolls down the entire content at a slow, steady pace
2. The scroll speed is derived from the slideshow delay setting (higher delay = slower scroll)
3. When reaching the bottom (last page fully visible), automatically scroll back to the top and restart

## Implementation

### 1. Slideshow State & Hook

Create `src/hooks/use-slideshow.ts`:

```typescript
type SlideshowState = {
  isActive: boolean;
  isPaused: boolean;
};

type UseSlideshowReturn = {
  isActive: boolean;
  isPaused: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  pause: () => void;
  resume: () => void;
};

export const useSlideshow = (options: {
  delay: number;
  onAdvance: () => void;
  enabled: boolean;
}): UseSlideshowReturn => { ... };
```

Core logic:
- Uses `setInterval` or `setTimeout` for timing
- `onAdvance` callback is called when it's time to move to the next page (single-page mode)
- Cleans up intervals on unmount or when stopped
- `pause`/`resume` for manual interruption (e.g., user clicks to explore)

### 2. Single Page Slideshow with Auto-Scroll

Create `src/hooks/use-slideshow-scroll.ts`:

For zoomed pages in single-page mode, this hook handles the slow scroll:

```typescript
export const useSlideshowScroll = (options: {
  containerRef: RefObject<HTMLDivElement>;
  isActive: boolean;
  delay: number; // total time for scroll + page display
  zoomLevel: number;
  onScrollComplete: () => void;
}) => { ... };
```

Logic:
1. Determine if the content is scrollable (`scrollHeight > clientHeight`)
2. If scrollable:
   - Calculate scroll distance: `scrollHeight - clientHeight`
   - Calculate scroll duration: `delay * 0.9` (leave 10% of delay as pause at bottom)
   - Use `requestAnimationFrame` for smooth linear scrolling
   - Scroll position at time `t`: `(t / duration) * scrollDistance`
   - When scroll completes, wait remaining delay, then call `onScrollComplete`
3. If not scrollable (fits in viewport):
   - Simply wait the full delay, then call `onScrollComplete`

```typescript
const animateScroll = (container: HTMLDivElement, distance: number, duration: number) => {
  const startTime = performance.now();
  const startScroll = 0;
  container.scrollTop = 0;

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    container.scrollTop = startScroll + distance * progress; // linear
    
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      // Scroll complete
      setTimeout(onScrollComplete, delay * 0.1);
    }
  };

  requestAnimationFrame(step);
};
```

### 3. Scroll Mode Auto-Scroll

Create `src/hooks/use-auto-scroll.ts`:

For scroll mode continuous scrolling:

```typescript
export const useAutoScroll = (options: {
  containerRef: RefObject<HTMLDivElement>;
  isActive: boolean;
  delay: number; // used to compute scroll speed
  onReachedBottom: () => void;
}) => { ... };
```

Logic:
1. Calculate scroll speed: `pixelsPerFrame = scrollHeight / (delay * 60)` — adjustable. The idea is that at the default 5000ms delay, each "page" takes about 5 seconds to scroll through.
2. Use `requestAnimationFrame` for continuous smooth scrolling
3. Each frame: `container.scrollTop += pixelsPerFrame`
4. When `scrollTop + clientHeight >= scrollHeight`:
   - Pause briefly (1 second)
   - Reset `scrollTop = 0`
   - Continue scrolling (restart loop)

Speed calculation refinement:
- Total scroll distance = `scrollHeight - clientHeight`
- Total desired time = `(totalPages * delay)` milliseconds
- pixels per ms = `totalDistance / totalTime`
- pixels per frame (at 60fps) = `pixelsPerMs * (1000/60)`

### 4. Slideshow Indicator

Create `src/components/viewer/slideshow-indicator.tsx`:

When slideshow is active, show a small floating indicator:
- "Slideshow" label with a pulsing dot or play icon
- A progress bar showing time until next page (single-page mode)
- Pause/Stop buttons
- Positioned in the bottom-left corner
- Semi-transparent background

```tsx
type SlideshowIndicatorProps = {
  isActive: boolean;
  isPaused: boolean;
  progress: number; // 0-1, time progress toward next advance
  onTogglePause: () => void;
  onStop: () => void;
};
```

### 5. Integration Points

**In SinglePageMode (`single-page-mode.tsx`):**
```typescript
const { isActive, toggle, stop } = useSlideshow({
  delay: settings.slideshowDelay,
  onAdvance: nextPage,
  enabled: true,
});

useSlideshowScroll({
  containerRef: imageContainerRef,
  isActive,
  delay: settings.slideshowDelay,
  zoomLevel: activeTab.zoomLevel,
  onScrollComplete: nextPage,
});
```

**In ScrollMode (`scroll-mode.tsx`):**
```typescript
useAutoScroll({
  containerRef: scrollContainerRef,
  isActive: slideshowActive,
  delay: settings.slideshowDelay,
  onReachedBottom: () => { /* loop handled internally */ },
});
```

### 6. Slideshow Toggle

The slideshow is toggled by:
- The "S" hotkey (implemented in task 10)
- A play/pause button in the viewer header or sidebar

Add a slideshow toggle button to the `ViewerHeader` component (from task 6):
```tsx
<button onClick={onToggleSlideshow}>
  {isSlideshowActive ? <PauseIcon /> : <PlayIcon />}
</button>
```

Update `ViewerHeader` props to include slideshow state and toggle callback.

## Acceptance Criteria
- Single page slideshow auto-advances to the next page after the configured delay
- When zoomed in, the page slowly scrolls to the bottom before advancing
- Scroll mode slideshow continuously auto-scrolls at a configurable pace
- Scroll mode loops back to top when reaching the end
- Slideshow can be started, paused, and stopped
- Visual indicator shows slideshow state and progress
- Slideshow uses the delay from settings
- Scroll animation is smooth (uses requestAnimationFrame, not setInterval)
- Slideshow stops at the last page in single-page mode (or loops if configured)
