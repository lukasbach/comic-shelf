import React, { useState, useEffect, useRef } from 'react';
import { ComicPage } from '../../types/comic';
import { getImageUrl } from '../../utils/image-utils';
import { FavoriteButton } from '../favorite-button';
import { RxStarFilled } from 'react-icons/rx';
import { ComicContextMenu } from '../comic-context-menu';

type LazyPageProps = {
  page: ComicPage;
  zoomLevel: number;
  onVisible?: (pageNumber: number) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onIncrementViewCount?: () => void;
  onDecrementViewCount?: () => void;
};

export const LazyPage: React.ForwardRefExoticComponent<LazyPageProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<HTMLDivElement, LazyPageProps>(
  ({ page, zoomLevel, onVisible, isFavorite, onToggleFavorite, onIncrementViewCount, onDecrementViewCount }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const internalRef = useRef<HTMLDivElement>(null);
    
    // Sync internal ref with forwarded ref
    useEffect(() => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(internalRef.current);
      } else {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = internalRef.current;
      }
    });

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (onVisible) {
              onVisible(page.page_number - 1);
            }
          }
        },
        { 
          rootMargin: '100% 0px', // Preload 1 viewport above/below
          threshold: 0
        }
      );

      if (internalRef.current) {
        observer.observe(internalRef.current);
      }

      return () => {
        observer.disconnect();
      };
    }, [page.page_number, onVisible]);

    const isFitWidth = zoomLevel === 100;
    
    // Estimate height based on aspect ratio if available, otherwise use a default
    // Most comics are roughly 1:1.4 aspect ratio. 
    // We use a fixed pixel min-height to avoid 0px height which breaks intersection.
    const estimatedHeight = '800px';

    return (
      <ComicContextMenu
        page={page}
        isFavorite={page.is_favorite === 1}
        viewCount={page.view_count}
        onToggleFavorite={onToggleFavorite}
        onIncrementViewCount={onIncrementViewCount}
        onDecrementViewCount={onDecrementViewCount}
      >
        <div
          ref={internalRef}
          className="group flex flex-col items-center w-full mb-2 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative"
          style={{ minHeight: !isVisible ? estimatedHeight : 'auto' }}
        >
          <div className="w-full flex justify-between items-center px-4 py-1 text-xs text-gray-500 bg-gray-200 dark:bg-gray-900">
            <span>Page {page.page_number}</span>
            {isFavorite && <RxStarFilled className="group-hover:hidden text-yellow-500" />}
          </div>

          {onToggleFavorite && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <FavoriteButton 
                isFavorite={isFavorite || false} 
                onToggle={onToggleFavorite} 
                size="sm"
                className="bg-black/40 backdrop-blur-sm p-1.5 rounded-full text-white shadow-lg"
              />
            </div>
          )}
          
          {isVisible && (
            <img
              src={getImageUrl(page.file_path)}
              alt={`Page ${page.page_number}`}
              className="block"
              style={{
                width: isFitWidth ? '100%' : `${zoomLevel}%`,
                height: 'auto',
                maxWidth: isFitWidth ? '100%' : 'none',
              }}
            />
          )}
          {!isVisible && (
            <div className="flex items-center justify-center p-20">
              <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
          )}
        </div>
      </ComicContextMenu>
    );
  }
);

LazyPage.displayName = 'LazyPage';
