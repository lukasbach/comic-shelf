import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTabs } from '../contexts/tab-context';
import type { Comic } from '../types/comic';

export const useOpenComic = () => {
  const navigate = useNavigate();
  const { openTab } = useTabs();

  return (comic: Comic, e?: React.MouseEvent) => {
    const isNewTab = e ? (e.ctrlKey || e.metaKey || (e as any).button === 1) : false;
    
    openTab(comic, isNewTab);
    navigate({ to: '/viewer/$comicId', params: { comicId: String(comic.id) } });
  };
};
