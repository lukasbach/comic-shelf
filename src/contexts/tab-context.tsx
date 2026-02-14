import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Tab } from '../stores/tab-store';
import { Comic } from '../types/comic';

interface TabContextType {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (comic: Comic) => void;
  closeTab: (tabId: string) => void;
  setActiveTabId: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  nextTab: () => void;
  prevTab: () => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const TabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const openTab = useCallback((comic: Comic) => {
    setTabs((prevTabs) => {
      const existingTab = prevTabs.find((t) => t.comicId === comic.id);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        return prevTabs;
      }

      const newTab: Tab = {
        id: crypto.randomUUID(),
        comicId: comic.id,
        title: comic.title,
        currentPage: 0,
        viewMode: 'single',
        zoomLevel: 100,
      };

      setActiveTabId(newTab.id);
      return [...prevTabs, newTab];
    });
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs((prevTabs) => {
      const tabIndex = prevTabs.findIndex((t) => t.id === tabId);
      if (tabIndex === -1) return prevTabs;

      const newTabs = prevTabs.filter((t) => t.id !== tabId);

      if (activeTabId === tabId) {
        if (newTabs.length > 0) {
          const nextIndex = Math.min(tabIndex, newTabs.length - 1);
          setActiveTabId(newTabs[nextIndex].id);
        } else {
          setActiveTabId(null);
        }
      }

      return newTabs;
    });
  }, [activeTabId]);

  const updateTab = useCallback((tabId: string, updates: Partial<Tab>) => {
    setTabs((prevTabs) =>
      prevTabs.map((t) => (t.id === tabId ? { ...t, ...updates } : t))
    );
  }, []);

  const nextTab = useCallback(() => {
    setTabs((prevTabs) => {
      if (prevTabs.length <= 1) return prevTabs;
      const currentIndex = prevTabs.findIndex((t) => t.id === activeTabId);
      const nextIndex = (currentIndex + 1) % prevTabs.length;
      setActiveTabId(prevTabs[nextIndex].id);
      return prevTabs;
    });
  }, [activeTabId]);

  const prevTab = useCallback(() => {
    setTabs((prevTabs) => {
      if (prevTabs.length <= 1) return prevTabs;
      const currentIndex = prevTabs.findIndex((t) => t.id === activeTabId);
      const prevIndex = (currentIndex - 1 + prevTabs.length) % prevTabs.length;
      setActiveTabId(prevTabs[prevIndex].id);
      return prevTabs;
    });
  }, [activeTabId]);

  const value: TabContextType = {
    tabs,
    activeTabId,
    openTab,
    closeTab,
    setActiveTabId,
    updateTab,
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
