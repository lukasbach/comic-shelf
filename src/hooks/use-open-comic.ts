import React from 'react';
import { useTabs } from '../contexts/tab-context';
import type { Comic } from '../types/comic';

export const useOpenComic = () => {
  const { openTab } = useTabs();

  return (comic: Comic, e?: React.MouseEvent) => {
    const isNewTab = e ? (e.ctrlKey || e.metaKey || (e as any).button === 1) : false;
    
    openTab(comic, isNewTab, {
      path: `/viewer/${comic.id}`
    });
  };
};
