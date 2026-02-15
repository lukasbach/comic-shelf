import React, { useState, useEffect, useRef } from 'react';
import { ComicPage } from '../../types/comic';
import { FavoriteButton } from '../favorite-button';
import { RxStarFilled, RxLayers, RxCross2 } from 'react-icons/rx';
import { ComicContextMenu } from '../comic-context-menu';
import { RenderedPageImage } from './rendered-page-image';

type LazyPageProps = {
  page: ComicPage;
  zoomLevel: number;
  fitMode: 'width' | 'both' | 'none';
  onVisible?: (pageNumber: number) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onIncrementViewCount?: () => void;
  onDecrementViewCount?: () => void;
  isGallery?: boolean;
  onRemoveFromGallery?: () => void;
  onAddToGallery?: () => void;
  enableGalleries?: boolean;
};

export const LazyPage: React.ForwardRefExoticComponent<LazyPageProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<HTMLDivElement, LazyPageProps>(
  ({ page, zoomLevel, fitMode, onVisible, isFavorite, onToggleFavorite, onIncrementViewCount, onDecrementViewCount, isGallery, onRemoveFromGallery, onAddToGallery, enableGalleries }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
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
            if (onVisible !== undefined) {
              // We don't have the index here, and page_number is original comic page number.
              // For now, we still use page_number - 1 but it's risky for galleries.
              // However, current ScrollMode doesn't use onVisible, it uses its own tracker.
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

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setNaturalSize({
        width: e.currentTarget.naturalWidth,
        height: e.currentTarget.naturalHeight,
      });
    };

    const isFitWidth = fitMode === 'width';
    const isFitBoth = fitMode === 'both';
    
    // Estimate height based on aspect ratio if available, otherwise use a default
    // Most comics are roughly 1:1.4 aspect ratio. 
    // We use a fixed pixel min-height to avoid 0px height which breaks intersection.
    const estimatedHeight = isFitBoth ? '100dvh' : '800px';

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
          style={{ 
            minHeight: !isVisible ? estimatedHeight : 'auto',
            height: isFitBoth ? '100dvh' : 'auto',
            justifyContent: isFitBoth ? 'center' : 'stretch'
          }}
        >
          <div className="w-full flex justify-between items-center px-4 py-1 text-xs text-gray-500 bg-gray-200 dark:bg-gray-900">
            <span>Page {page.page_number}</span>
            {isFavorite && <RxStarFilled className="group-hover:hidden text-yellow-500" />}
          </div>

          {enableGalleries && (
            <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {isGallery ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveFromGallery?.(); }}
                  className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-all border border-red-500/30 shadow-lg"
                  title="Remove from Gallery"
                >
                  <RxCross2 size={18} />
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onAddToGallery?.(); }}
                  className="p-1.5 bg-pink-600/80 hover:bg-pink-600 text-white rounded-lg transition-all border border-pink-500/30 shadow-lg"
                  title="Add to Gallery"
                >
                  <RxLayers size={18} />
                </button>
              )}
            </div>
          )}

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
            <RenderedPageImage
              page={page}
              alt={`Page ${page.page_number}`}
              className="block"
              onLoad={handleLoad}
              style={{
                width: isFitWidth 
                  ? '100%' 
                  : isFitBoth
                    ? 'auto'
                    : naturalSize 
                      ? `${(naturalSize.width * zoomLevel) / 100}px` 
                      : 'auto',
                height: isFitBoth ? 'auto' : 'auto',
                maxWidth: (isFitWidth || isFitBoth) ? '100%' : 'none',
                maxHeight: isFitBoth ? '100%' : 'none',
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
