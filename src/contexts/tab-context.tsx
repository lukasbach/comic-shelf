import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useRouterState, useNavigate } from '@tanstack/react-router';
import { Tab } from '../stores/tab-store';
import { Comic } from '../types/comic';

interface TabContextType {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (comic: Comic) => void;
  openLibraryTab: (path: string, title: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTabId: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  reorderTabs: (oldIndex: number, newIndex: number) => void;
  nextTab: () => void;
  prevTab: () => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

function getRouteTitle(path: string): string {
  if (path === '/library' || path === '/library/') return 'Explorer';
  if (path === '/library/list') return 'All Comics';
  if (path === '/library/artists') return 'By Artist';
  if (path === '/library/favorites') return 'Favorites';
  if (path === '/settings' || path === '/settings/') return 'Settings';
  if (path.startsWith('/viewer/')) return 'ComicShelf';
  return 'Library';
}

export const TabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const { location } = useRouterState();
  const navigate = useNavigate();

  // Sync current route with tabs
  useEffect(() => {
    const currentPath = location.pathname;
    
    if (tabs.length === 0) {
      // Initial load - create first tab
      const newTab: Tab = {
        id: crypto.randomUUID(),
        type: 'library',
        title: getRouteTitle(currentPath),
        path: currentPath,
      };
      
      setTabs([newTab]);
      setActiveTabId(newTab.id);
    } else if (activeTabId) {
      const activeTab = tabs.find(t => t.id === activeTabId);
      
      // Only update if the current path is different from the active tab's path
      // This prevents updating when we're switching tabs
      if (activeTab && activeTab.path !== currentPath) {
        setTabs(prevTabs => 
          prevTabs.map(t => 
            t.id === activeTabId 
              ? { ...t, path: currentPath, title: getRouteTitle(currentPath) }
              : t
          )
        );
      }
    }
  }, [location.pathname, activeTabId, tabs]);

  const openTab = useCallback((comic: Comic) => {
    // Always create a new tab (for middle-click behavior)
    const newTab: Tab = {
      id: crypto.randomUUID(),
      type: 'comic',
      comicId: comic.id,
      title: comic.title,
      path: `/viewer/${comic.id}`,
      currentPage: 0,
      viewMode: 'overview',
      zoomLevel: 100,
      sidebarCollapsed: false,
    };

    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const openLibraryTab = useCallback((path: string, title: string) => {
    // Always create a new tab (for middle-click behavior)
    const newTab: Tab = {
      id: crypto.randomUUID(),
      type: 'library',
      title: title,
      path: path,
    };

    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    const tabToClose = tabs.find(t => t.id === tabId);
    if (!tabToClose) return;

    const tabIndex = tabs.findIndex((t) => t.id === tabId);
    const newTabs = tabs.filter((t) => t.id !== tabId);

    if (activeTabId === tabId) {
      // Navigate to another tab
      if (newTabs.length > 0) {
        const nextIndex = Math.min(tabIndex, newTabs.length - 1);
        const nextTab = newTabs[nextIndex];
        navigate({ to: nextTab.path as any });
      } else {
        // No tabs left, navigate to library
        navigate({ to: '/library' });
      }
    }

    setTabs(newTabs);
  }, [tabs, activeTabId, navigate]);

  const updateTab = useCallback((tabId: string, updates: Partial<Tab>) => {
    setTabs((prevTabs) =>
      prevTabs.map((t) => (t.id === tabId ? { ...t, ...updates } : t))
    );
  }, []);

  const reorderTabs = useCallback((oldIndex: number, newIndex: number) => {
    setTabs((prevTabs) => {
      const newTabs = [...prevTabs];
      const [removed] = newTabs.splice(oldIndex, 1);
      newTabs.splice(newIndex, 0, removed);
      return newTabs;
    });
  }, []);

  const nextTab = useCallback(() => {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    const nextTab = tabs[nextIndex];
    navigate({ to: nextTab.path as any });
  }, [tabs, activeTabId, navigate]);

  const prevTab = useCallback(() => {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    const prevTab = tabs[prevIndex];
    navigate({ to: prevTab.path as any });
  }, [tabs, activeTabId, navigate]);

  const value: TabContextType = {
    tabs,
    activeTabId,
    openTab,
    openLibraryTab,
    closeTab,
    setActiveTabId,
    updateTab,
    reorderTabs,
    nextTab,
    prevTab,
  };

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
};

export const useTabs = () => {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTabs must be used within a TabProvider');
  }
  return context;
};
