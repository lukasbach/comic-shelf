import React from 'react';
import { useTabs } from '../contexts/tab-context';
import * as comicService from '../services/comic-service';

export const useOpenComicPage = () => {
  const { openTab } = useTabs();

  return async (comicId: number, pageNumber: number, e?: React.MouseEvent, comicInfo?: { id: number; path: string; title: string }) => {
    // Extract isNewTab BEFORE any await to prevent event loss/pooling issues
    const isNewTab = e ? (e.ctrlKey || e.metaKey || (e as any).button === 1) : false;
    
    let comic = comicInfo;
    if (!comic) {
      comic = (await comicService.getComicById(comicId)) || undefined;
    }

    if (!comic) return;
    
    // Open/update the tab first
    openTab(comic, isNewTab, {
      path: `/viewer/${comic.id}?page=${pageNumber}`,
      currentPage: pageNumber - 1,
      viewMode: 'single'
    });
  };
};
