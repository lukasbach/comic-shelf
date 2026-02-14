import { useEffect, useRef } from 'react';
import { useSettings } from '../contexts/settings-context';
import { useTabs } from '../contexts/tab-context';
import { formatKeyEvent } from '../utils/hotkey-utils';
import { useViewerRef } from '../contexts/viewer-ref-context';

export const useAppHotkeys = () => {
  const { settings } = useSettings();
  const { activeTabId, tabs, updateTab, closeTab, nextTab, prevTab } = useTabs();
  const { scrollContainerRef, scrollToPage } = useViewerRef();
  const activeTab = tabs.find(t => t.id === activeTabId);
  
  const scrollIntervalRef = useRef<number | null>(null);
  const activeScrollKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const startScrolling = (direction: 'up' | 'down', key: string) => {
      if (activeScrollKeyRef.current === key) return;
      
      stopScrolling();
      activeScrollKeyRef.current = key;
      
      const scroll = () => {
        if (scrollContainerRef.current) {
          const amount = direction === 'down' ? 15 : -15;
          scrollContainerRef.current.scrollBy({ top: amount, behavior: 'auto' });
          scrollIntervalRef.current = requestAnimationFrame(scroll);
        }
      };
      
      scrollIntervalRef.current = requestAnimationFrame(scroll);
    };

    const stopScrolling = (key?: string) => {
      if (key && activeScrollKeyRef.current !== key) return;
      
      if (scrollIntervalRef.current !== null) {
        cancelAnimationFrame(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      activeScrollKeyRef.current = null;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle hotkeys when in input/textarea/select
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const key = formatKeyEvent(e);
      const hotkeys = settings.hotkeys;

      // Scrolling (handled with animation frames for smoothness on hold)
      if (key === hotkeys.scrollDown) {
        if (scrollContainerRef.current) {
          e.preventDefault();
          startScrolling('down', key);
        }
      } else if (key === hotkeys.scrollUp) {
        if (scrollContainerRef.current) {
          e.preventDefault();
          startScrolling('up', key);
        }
      }

      // Tab Management
      else if (key === hotkeys.closeTab) {
        e.preventDefault();
        if (activeTabId) closeTab(activeTabId);
      }
      else if (key === hotkeys.nextTab) {
        e.preventDefault();
        nextTab();
      }
      else if (key === hotkeys.prevTab) {
        e.preventDefault();
        prevTab();
      }

      // Comic Viewer Hotkeys (only if active tab is a comic)
      else if (activeTab?.type === 'comic') {
        const isScrollMode = activeTab.viewMode === 'scroll';

        // Navigation
        if (key === hotkeys.nextPage) {
          e.preventDefault();
          if (activeTab.currentPage !== undefined) {
            if (isScrollMode) {
              scrollToPage(activeTab.currentPage + 1, 'smooth');
            } else {
              updateTab(activeTab.id, { currentPage: activeTab.currentPage + 1 });
            }
          }
        } else if (key === hotkeys.prevPage) {
          e.preventDefault();
          if (activeTab.currentPage !== undefined) {
             const prevPageIndex = Math.max(0, activeTab.currentPage - 1);
             if (isScrollMode) {
               scrollToPage(prevPageIndex, 'smooth');
             } else {
               updateTab(activeTab.id, { currentPage: prevPageIndex });
             }
          }
        }

        // Zoom
        else if (key === hotkeys.zoomIn) {
          e.preventDefault();
          updateTab(activeTab.id, { zoomLevel: Math.min(300, (activeTab.zoomLevel || 100) + 10) });
        } else if (key === hotkeys.zoomOut) {
          e.preventDefault();
          updateTab(activeTab.id, { zoomLevel: Math.max(50, (activeTab.zoomLevel || 100) - 10) });
        }

        // View Mode Toggle
        else if (key === hotkeys.toggleViewMode) {
          e.preventDefault();
          const modes: Array<'overview' | 'single' | 'scroll'> = ['overview', 'single', 'scroll'];
          const currentIndex = modes.indexOf(activeTab.viewMode || 'overview');
          const nextMode = modes[(currentIndex + 1) % modes.length];
          updateTab(activeTab.id, { viewMode: nextMode });
        }

        // Slideshow
        else if (key === hotkeys.toggleSlideshow) {
          e.preventDefault();
          updateTab(activeTab.id, { slideshowActive: !activeTab.slideshowActive });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = formatKeyEvent(e);
      if (key === settings.hotkeys.scrollUp || key === settings.hotkeys.scrollDown) {
        stopScrolling(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // Also stop scrolling if window loses focus
    window.addEventListener('blur', () => stopScrolling());

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', () => stopScrolling());
      stopScrolling();
    };
  }, [settings, activeTabId, activeTab, nextTab, prevTab, closeTab, updateTab, scrollContainerRef]);
};
