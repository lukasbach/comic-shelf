import React, { useState } from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  RxExternalLink,
  RxPlus,
  RxMinus,
  RxStar,
  RxStarFilled,
  RxOpenInNewWindow,
  RxArchive,
  RxDotsHorizontal,
  RxEyeOpen,
  RxEyeClosed
} from 'react-icons/rx';
import type { Comic, ComicPage } from '../types/comic';
import * as comicService from '../services/comic-service';
import * as comicPageService from '../services/comic-page-service';
import { useOpenComic } from '../hooks/use-open-comic';
import { useOpenComicPage } from '../hooks/use-open-comic-page';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { revealItemInDir } from '@tauri-apps/plugin-opener';

import { Gallery } from '../types/gallery';
import * as galleryService from '../services/gallery-service';

export interface ComicMenuProps {
  comic?: Comic;
  page?: ComicPage;
  gallery?: Gallery;
  onOpen?: () => void;
  // State for optimistic updates if provided
  isFavorite?: boolean;
  setIsFavorite?: (val: boolean) => void;
  isViewed?: boolean;
  setIsViewed?: (val: boolean) => void;
  viewCount?: number;
  setViewCount?: (val: number) => void;
  // Individual action overrides/callbacks
  onToggleFavorite?: () => void;
  onToggleViewed?: () => void;
  onIncrementViewCount?: () => void;
  onDecrementViewCount?: () => void;
  onUpdate?: () => void;
  // Extra items
  extraItems?: React.ReactNode;
}

const ComicMenuContent: React.FC<ComicMenuProps & { isDropdown?: boolean }> = ({ 
  comic, 
  page, 
  gallery,
  onOpen,
  isFavorite: controlledIsFavorite,
  setIsFavorite: controlledSetIsFavorite,
  isViewed: controlledIsViewed,
  setIsViewed: controlledSetIsViewed,
  viewCount: controlledViewCount,
  setViewCount: controlledSetViewCount,
  onToggleFavorite: manualToggleFavorite,
  onToggleViewed: manualToggleViewed,
  onIncrementViewCount: manualIncrement,
  onDecrementViewCount: manualDecrement,
  onUpdate,
  isDropdown = false,
  extraItems
}) => {
  const openComic = useOpenComic();
  const openComicPage = useOpenComicPage();

  const id = comic?.id || page?.comic_id || gallery?.id;
  const path = comic?.path || page?.file_path;
  const isComic = !!comic;
  const isGallery = !!gallery;
  
  const [localIsFavorite, setLocalIsFavorite] = useState(
    isComic ? comic?.is_favorite === 1 : 
    isGallery ? gallery?.is_favorite === 1 : 
    page?.is_favorite === 1
  );
  const [localIsViewed, setLocalIsViewed] = useState(
    isComic ? comic?.is_viewed === 1 : 
    isGallery ? gallery?.is_viewed === 1 : 
    page?.is_viewed === 1
  );
  const [localViewCount, setLocalViewCount] = useState(
    isComic ? comic?.view_count : 
    isGallery ? gallery?.view_count : 
    page?.view_count || 0
  );

  const fav = controlledIsFavorite ?? localIsFavorite;
  const setFav = controlledSetIsFavorite ?? setLocalIsFavorite;
  
  const viewed = controlledIsViewed ?? localIsViewed;
  const setViewed = controlledSetIsViewed ?? setLocalIsViewed;

  const count = controlledViewCount ?? localViewCount ?? 0;
  const setCount = controlledSetViewCount ?? setLocalViewCount;

  const handleOpen = () => {
    if (onOpen) {
      onOpen();
    } else if (comic) {
      openComic(comic);
    } else if (page) {
      const comicInfo = (page as any).comic_path ? {
        id: page.comic_id,
        title: (page as any).comic_title,
        path: (page as any).comic_path
      } : undefined;
      openComicPage(page.comic_id, page.page_number, undefined, comicInfo);
    }
  };

  const handleOpenInNewTab = () => {
    if (comic) {
      openComic(comic, { ctrlKey: true } as any);
    } else if (page) {
      const comicInfo = (page as any).comic_path ? {
        id: page.comic_id,
        title: (page as any).comic_title,
        path: (page as any).comic_path
      } : undefined;
      openComicPage(page.comic_id, page.page_number, { ctrlKey: true } as any, comicInfo);
    } else if (gallery) {
      if (onOpen) onOpen();
    }
  };

  const handleOpenInNewWindow = async () => {
    if (!id) {
      console.warn('Cannot open in new window: No comic or page ID found');
      return;
    }

    if (isGallery) {
      // Galleries don't have a direct viewer URL exactly, but they might in the future.
      // For now we just use the onOpen.
      if (onOpen) onOpen();
      return;
    }

    const label = `viewer-${id}-${Date.now()}`;
    const url = `/viewer/${id}${!isComic && page ? `?page=${page.page_number}` : ''}`;
    
    console.log(`Opening new window: ${label} with URL: ${url}`);
    
    try {
      const webview = new WebviewWindow(label, {
        url,
        title: comic?.title || 'ComicShelf',
        width: 1000,
        height: 800,
        center: true,
      });

      webview.once('tauri://error', (e) => {
        console.error('Failed to create window:', e);
      });
    } catch (e) {
      console.error('Failed to create window:', e);
    }
  };

  const handleToggleFavorite = async () => {
    if (manualToggleFavorite) {
      manualToggleFavorite();
      return;
    }
    if (isComic && comic) {
        try {
            setFav(!fav);
            await comicService.toggleFavorite(comic.id);
            onUpdate?.();
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
            setFav(fav);
        }
    } else if (isGallery && gallery) {
        try {
            setFav(!fav);
            await galleryService.toggleGalleryFavorite(gallery.id);
            onUpdate?.();
        } catch (error) {
            console.error('Failed to toggle gallery favorite:', error);
            setFav(fav);
        }
    } else if (page) {
        try {
            setFav(!fav);
            await comicPageService.togglePageFavorite(page.id);
            onUpdate?.();
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
            setFav(fav);
        }
    }
  };

  const handleToggleViewed = async () => {
    if (manualToggleViewed) {
      manualToggleViewed();
      return;
    }
    if (isComic && comic) {
        try {
            setViewed(!viewed);
            await comicService.toggleViewed(comic.id);
            onUpdate?.();
        } catch (error) {
            console.error('Failed to toggle viewed:', error);
            setViewed(viewed);
        }
    } else if (isGallery && gallery) {
      try {
          setViewed(!viewed);
          await galleryService.toggleGalleryViewed(gallery.id);
          onUpdate?.();
      } catch (error) {
          console.error('Failed to toggle gallery viewed:', error);
          setViewed(viewed);
      }
    } else if (page) {
        try {
            setViewed(!viewed);
            await comicPageService.togglePageViewed(page.id);
            onUpdate?.();
        } catch (error) {
            console.error('Failed to toggle viewed:', error);
            setViewed(viewed);
        }
    }
  };

  const handleIncrementViewCount = async () => {
    if (manualIncrement) {
      manualIncrement();
      return;
    }
    if (isComic && comic) {
        try {
            setCount(count + 1);
            await comicService.incrementViewCount(comic.id);
            onUpdate?.();
        } catch (error) {
            console.error('Failed to increment view count:', error);
            setCount(count);
        }
    } else if (isGallery && gallery) {
      try {
          setCount(count + 1);
          await galleryService.incrementGalleryViewCount(gallery.id);
          onUpdate?.();
      } catch (error) {
          console.error('Failed to increment gallery view count:', error);
          setCount(count);
      }
    } else if (page) {
        try {
            setCount(count + 1);
            await comicPageService.incrementPageViewCount(page.id);
            onUpdate?.();
        } catch (error) {
            console.error('Failed to increment view count:', error);
            setCount(count);
        }
    }
  };

  const handleDecrementViewCount = async () => {
    if (manualDecrement) {
      manualDecrement();
      return;
    }
    if (isComic && comic) {
        try {
            setCount(Math.max(0, count - 1));
            await comicService.decrementViewCount(comic.id);
            onUpdate?.();
        } catch (error) {
            console.error('Failed to decrement view count:', error);
            setCount(count);
        }
    } else if (isGallery && gallery) {
      try {
          setCount(Math.max(0, count - 1));
          await galleryService.decrementGalleryViewCount(gallery.id);
          onUpdate?.();
      } catch (error) {
          console.error('Failed to decrement gallery view count:', error);
          setCount(count);
      }
    } else if (page) {
        try {
            setCount(Math.max(0, count - 1));
            await comicPageService.decrementPageViewCount(page.id);
            onUpdate?.();
        } catch (error) {
            console.error('Failed to decrement view count:', error);
            setCount(count);
        }
    }
  };

  const handleShowInExplorer = async () => {
    if (path) {
      await revealItemInDir(path);
    }
  };

  const MenuItem = isDropdown ? DropdownMenu.Item : ContextMenu.Item;
  const MenuSeparator = isDropdown ? DropdownMenu.Separator : ContextMenu.Separator;

  const itemClass = "flex items-center gap-2 px-2 py-1.5 text-sm outline-none cursor-default hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm transition-colors text-gray-700 dark:text-gray-200";
  const separatorClass = "h-px bg-gray-200 dark:bg-gray-700 my-1";

  return (
    <>
      <MenuItem className={itemClass} onSelect={handleOpen}>
        <RxExternalLink className="w-4 h-4" />
        <span>Open</span>
      </MenuItem>
      
      {!isGallery && (
        <>
          <MenuItem className={itemClass} onSelect={handleOpenInNewTab}>
            <RxExternalLink className="w-4 h-4" />
            <span>Open in new tab</span>
          </MenuItem>
          <MenuItem className={itemClass} onSelect={handleOpenInNewWindow}>
            <RxOpenInNewWindow className="w-4 h-4" />
            <span>Open in new window</span>
          </MenuItem>
        </>
      )}
      
      <MenuSeparator className={separatorClass} />
      
      <MenuItem className={itemClass} onSelect={handleIncrementViewCount}>
        <RxPlus className="w-4 h-4" />
        <span>Increase Viewed Count ({count})</span>
      </MenuItem>
      <MenuItem className={itemClass} onSelect={handleDecrementViewCount}>
        <RxMinus className="w-4 h-4" />
        <span>Decrease Viewed Count</span>
      </MenuItem>
      
      <MenuItem className={itemClass} onSelect={handleToggleFavorite}>
        {fav ? <RxStarFilled className="w-4 h-4 text-yellow-500" /> : <RxStar className="w-4 h-4" />}
        <span>{fav ? 'Remove from favorites' : 'Add to favorites'}</span>
      </MenuItem>

      <MenuItem className={itemClass} onSelect={handleToggleViewed}>
        {viewed ? <RxEyeOpen className="w-4 h-4 text-blue-500" /> : <RxEyeClosed className="w-4 h-4" />}
        <span>{viewed ? 'Mark as unviewed' : 'Mark as viewed'}</span>
      </MenuItem>
      
      {extraItems && (
        <>
          <MenuSeparator className={separatorClass} />
          {extraItems}
        </>
      )}

      {path && (
        <>
          <MenuSeparator className={separatorClass} />
          <MenuItem className={itemClass} onSelect={handleShowInExplorer}>
            <RxArchive className="w-4 h-4" />
            <span>Show in Explorer</span>
          </MenuItem>
        </>
      )}
    </>
  );
};

export const ComicContextMenu: React.FC<ComicMenuProps & { children: React.ReactNode }> = ({ children, ...props }) => {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content 
          className="min-w-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg p-1 z-100"
        >
          <ComicMenuContent {...props} isDropdown={false} />
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};

export const ComicDropdownMenu: React.FC<ComicMenuProps & { trigger?: React.ReactNode, className?: string }> = ({ trigger, className, ...props }) => {
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          {trigger || (
            <button 
              className={`flex items-center justify-center transition-colors rounded-full shrink-0 ${className || 'w-8 h-8 p-1 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
              aria-label="More options"
              onClick={(e) => e.stopPropagation()}
            >
              <RxDotsHorizontal className={`${className?.includes('w-') ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </button>
          )}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content 
            className="min-w-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg p-1 z-100"
            align="end"
          >
            <ComicMenuContent {...props} isDropdown={true} />
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  };
