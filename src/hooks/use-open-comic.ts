import { useNavigate } from '@tanstack/react-router';
import { useTabs } from '../contexts/tab-context';
import type { Comic } from '../types/comic';

export const useOpenComic = () => {
  const navigate = useNavigate();
  const { openTab } = useTabs();

  return (comic: Comic) => {
    openTab(comic);
    navigate({ to: '/viewer/$comicId', params: { comicId: String(comic.id) } });
  };
};
