import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useRouterState, useNavigate, useRouter } from '@tanstack/react-router';
import { Tab } from '../stores/tab-store';
import { useSettings } from './settings-context';

interface TabContextType {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (comic: { id: number; path: string; title: string }, newTab?: boolean, options?: { path?: string; currentPage?: number; viewMode?: 'overview' | 'single' | 'scroll' }) => void;
  openLibraryTab: (path: string, title: string, newTab?: boolean) => void;
  closeTab: (tabId: string) => void;
  setActiveTabId: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  reorderTabs: (oldIndex: number, newIndex: number) => void;
  nextTab: () => void;
  prevTab: () => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

function getRouteTitle(path: string): string {
  if (path === '/library' || path === '/library/') return 'Explorer';
  if (path === '/library/list') return 'All Comics';
  if (path === '/library/all-pages') return 'All Pages';
  if (path === '/library/artists') return 'Artists';
  if (path === '/library/favorites') return 'Favorites';
  if (path === '/library/galleries') return 'Galleries';
  if (path === '/settings' || path === '/settings/') return 'Settings';
  if (path.startsWith('/viewer/')) {
    if (path.includes('gallery-')) return 'Gallery';
    return 'Comic';
  }
  return 'Library';
}

export const TabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isSwitchingTab, setIsSwitchingTab] = useState(false);
  const { location } = useRouterState();
  const navigate = useNavigate();
  const router = useRouter();
  const { settings, isLoading: isLoadingSettings } = useSettings();

  // Sync current route with tabs
  useEffect(() => {
    if (isLoadingSettings) return;
    
    const currentPath = location.pathname + (location.searchStr ? `?${location.searchStr}` : '');
    
    if (tabs.length === 0) {
      // Correctly initialize the first tab if none exist
      const initialTab: Tab = {
        id: crypto.randomUUID(),
        type: location.pathname.startsWith('/viewer/') ? 'comic' : 'library',
        path: currentPath,
        title: getRouteTitle(location.pathname),
        currentPage: 0,
        viewMode: settings.defaultViewMode || 'overview',
        zoomLevel: settings.defaultZoomLevel || 100,
        fitMode: settings.defaultFitMode || 'width',
        sidebarCollapsed: false,
      };

      if (initialTab.type === 'comic') {
        const idMatch = location.pathname.match(/\/viewer\/(\d+)/);
        if (idMatch) {
          initialTab.comicId = parseInt(idMatch[1]);
        } else {
          const galleryMatch = location.pathname.match(/\/viewer\/gallery-(\d+)/);
          if (galleryMatch) {
            initialTab.galleryId = parseInt(galleryMatch[1]);
          }
        }
      }

      setTabs([initialTab]);
      setActiveTabId(initialTab.id);
    } else if (activeTabId) {
      const activeTab = tabs.find(t => t.id === activeTabId);
      
      if (activeTab) {
        if (isSwitchingTab) {
          // If we are switching tabs, wait until the router catches up to the tab's path.
          // We ignore search parameters during this initial catch-up to avoid getting stuck.
          const tabBase = activeTab.path.split('?')[0];
          const currentBase = currentPath.split('?')[0];
          
          if (tabBase === currentBase) {
            setIsSwitchingTab(false);
          }
          return;
        }

        // Only update if the current path is different from the active tab's path
        if (activeTab.path !== currentPath) {
          const isViewer = location.pathname.startsWith('/viewer/');
          const isSettings = location.pathname.startsWith('/settings');
          const isLibrary = location.pathname.startsWith('/library');
          
          setTabs(prevTabs => 
            prevTabs.map(t => {
              if (t.id === activeTabId) {
                const updates: Partial<Tab> = {
                  path: currentPath,
                  title: getRouteTitle(location.pathname),
                };

                if (isViewer) {
                  updates.type = 'comic';
                  const idMatch = location.pathname.match(/\/viewer\/(\d+)/);
                  if (idMatch) {
                    updates.comicId = parseInt(idMatch[1]);
                    updates.galleryId = undefined;
                  } else {
                    const galleryMatch = location.pathname.match(/\/viewer\/gallery-(\d+)/);
                    if (galleryMatch) {
                      updates.galleryId = parseInt(galleryMatch[1]);
                      updates.comicId = undefined;
                    }
                  }
                } else if (isLibrary || isSettings) {
                  updates.type = 'library';
                }

                return { ...t, ...updates };
              }
              return t;
            })
          );
        }
      }
    }
  }, [location.pathname, location.searchStr, activeTabId, tabs, isSwitchingTab, settings, isLoadingSettings]);

  const openTab = useCallback((
    comic: { id: number; path: string; title: string }, 
    newTab: boolean = true,
    options?: { path?: string; currentPage?: number; viewMode?: 'overview' | 'single' | 'scroll' }
  ) => {
    const targetPath = options?.path || `/viewer/${comic.id}`;
    const tabData: Partial<Tab> = {
      type: 'comic',
      comicId: comic.id,
      comicPath: comic.path,
      title: comic.title,
      path: targetPath,
      currentPage: options?.currentPage ?? 0,
      viewMode: options?.viewMode || (options?.currentPage !== undefined ? 'single' : settings.defaultViewMode || 'overview'),
      zoomLevel: settings.defaultZoomLevel || 100,
      fitMode: settings.defaultFitMode || 'width',
      sidebarCollapsed: false,
    };

    if (newTab || !activeTabId) {
      const newTabObj: Tab = {
        ...tabData as Tab,
        id: crypto.randomUUID(),
      };
      setIsSwitchingTab(true);
      setTabs(prevTabs => [...prevTabs, newTabObj]);
      setActiveTabId(newTabObj.id);
      router.history.push(newTabObj.path);
    } else {
      setIsSwitchingTab(true);
      setTabs(prevTabs => 
        prevTabs.map(t => 
          t.id === activeTabId 
            ? { ...t, ...tabData }
            : t
        )
      );
      router.history.push(targetPath);
    }
  }, [activeTabId, router, settings]);

  const openLibraryTab = useCallback((path: string, title: string, newTab: boolean = true) => {
    const tabData: Partial<Tab> = {
      type: 'library',
      title: title,
      path: path,
    };

    if (newTab || !activeTabId) {
      const newTabObj: Tab = {
        ...tabData as Tab,
        id: crypto.randomUUID(),
      };
      setIsSwitchingTab(true);
      setTabs(prevTabs => [...prevTabs, newTabObj]);
      setActiveTabId(newTabObj.id);
      router.history.push(newTabObj.path);
    } else {
      setIsSwitchingTab(true);
      setTabs(prevTabs => 
        prevTabs.map(t => 
          t.id === activeTabId 
            ? { ...t, ...tabData }
            : t
        )
      );
      router.history.push(path);
    }
  }, [activeTabId, router]);

  const switchTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setIsSwitchingTab(true);
      setActiveTabId(tabId);
      router.history.push(tab.path);
    }
  }, [tabs, router]);

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
        setIsSwitchingTab(true);
        setActiveTabId(nextTab.id);
        router.history.push(nextTab.path);
      } else {
        // No tabs left, navigate to library
        router.history.push('/library');
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
    switchTab(tabs[nextIndex].id);
  }, [tabs, activeTabId, switchTab]);

  const prevTab = useCallback(() => {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    switchTab(tabs[prevIndex].id);
  }, [tabs, activeTabId, switchTab]);

  const value: TabContextType = {
    tabs,
    activeTabId,
    openTab,
    openLibraryTab,
    closeTab,
    setActiveTabId,
    switchTab,
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
