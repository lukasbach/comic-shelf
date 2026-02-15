import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTabs } from '../contexts/tab-context';
import * as comicService from '../services/comic-service';

export const useOpenComicPage = () => {
  const navigate = useNavigate();
  const { openTab } = useTabs();

  return async (comicId: number, pageNumber: number, e?: React.MouseEvent) => {
    const comic = await comicService.getComicById(comicId);
    if (!comic) return;
    
    const isNewTab = e ? (e.ctrlKey || e.metaKey || (e as any).button === 1) : false;
    
    openTab(comic, isNewTab);
    navigate({ 
      to: '/viewer/$comicId', 
      params: { comicId: String(comic.id) },
      search: { page: pageNumber }
    });
  };
};
