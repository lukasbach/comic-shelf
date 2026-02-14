import { useNavigate } from '@tanstack/react-router';
import { useTabs } from '../contexts/tab-context';
import * as comicService from '../services/comic-service';

export const useOpenComicPage = () => {
  const navigate = useNavigate();
  const { openTab } = useTabs();

  return async (comicId: number, pageNumber: number) => {
    const comic = await comicService.getComicById(comicId);
    if (!comic) return;
    
    openTab(comic);
    navigate({ 
      to: '/viewer/$comicId', 
      params: { comicId: String(comic.id) },
      search: { page: pageNumber }
    });
  };
};
