import { useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearch } from '@tanstack/react-router';
import { useSettings } from '../contexts/settings-context';
import { useTabs } from '../contexts/tab-context';
import { formatKeyEvent } from '../utils/hotkey-utils';
import { useViewerRef } from '../contexts/viewer-ref-context';
import { useGridNavigation } from '../contexts/grid-navigation-context';

export const useAppHotkeys = () => {
  const { settings } = useSettings();
  const { activeTabId, tabs, updateTab, closeTab, nextTab, prevTab } = useTabs();
  const { scrollContainerRef, nextPage, prevPage } = useViewerRef();
  const { moveFocus, activateFocus } = useGridNavigation();
  const navigate = useNavigate();
  const location = useLocation();
  const search = useSearch({ strict: false }) as any;
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

    const handleBackspace = () => {
      if (activeTab?.type === 'comic') {
        if (activeTab.viewMode === 'overview') {
          // Go to library folder
          if (activeTab.comicPath && !activeTab.comicPath.startsWith('gallery://')) {
            const parentPath = activeTab.comicPath.split(/[\\/]/).slice(0, -1).join('/');
            navigate({ to: '/library', search: { path: parentPath } });
          } else if (activeTab.galleryId) {
            navigate({ to: '/library/galleries' });
          } else {
            navigate({ to: '/library' });
          }
        } else {
          updateTab(activeTab.id, { viewMode: 'overview' });
        }
      } else if (location.pathname.startsWith('/library')) {
        const currentPath = search.path || '';
        if (currentPath) {
          const segments = currentPath.split(/[\\/]/).filter(Boolean);
          segments.pop();
          const parentPath = segments.join('/');
          navigate({ to: '/library', search: { path: parentPath } });
        } else if (location.pathname !== '/library') {
          navigate({ to: '/library' });
        }
      }
    };

    const handleEnter = () => {
      if (activeTab?.type === 'comic') {
        if (activeTab.viewMode === 'overview') {
          updateTab(activeTab.id, { viewMode: 'single' });
        }
      } else {
        activateFocus();
      }
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

      // Backspace: navigate up or switch to overview
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
        return;
      }

      // Enter: switch to single page in comic viewer, or open focused card in library
      if (e.key === 'Enter') {
        e.preventDefault();
        handleEnter();
        return;
      }

      // Arrow keys for grid navigation (if not in a viewer mode that uses them for paging/scrolling)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const isViewerNav = activeTab?.type === 'comic' && (activeTab.viewMode === 'single' || activeTab.viewMode === 'scroll');
        if (!isViewerNav) {
          e.preventDefault();
          const direction = e.key.replace('Arrow', '').toLowerCase() as any;
          moveFocus(direction);
          return;
        }
      }

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
        // Navigation
        if (key === hotkeys.nextPage) {
          e.preventDefault();
          nextPage();
        } else if (key === hotkeys.prevPage) {
          e.preventDefault();
          prevPage();
        }

        // Zoom
        else if (key === hotkeys.zoomIn) {
          e.preventDefault();
          updateTab(activeTab.id, { 
            zoomLevel: Math.min(500, (activeTab.zoomLevel || 100) + 10),
            fitMode: 'none'
          });
        } else if (key === hotkeys.zoomOut) {
          e.preventDefault();
          updateTab(activeTab.id, { 
            zoomLevel: Math.max(10, (activeTab.zoomLevel || 100) - 10),
            fitMode: 'none'
          });
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
