import React, { useState, useEffect, useRef } from 'react';
import { ComicPage } from '../../types/comic';
import { getImageUrl } from '../../utils/image-utils';
import { RxStarFilled } from 'react-icons/rx';

type LazyPageProps = {
  page: ComicPage;
  zoomLevel: number;
  onVisible?: (pageNumber: number) => void;
  isFavorite?: boolean;
};

export const LazyPage: React.ForwardRefExoticComponent<LazyPageProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<HTMLDivElement, LazyPageProps>(
  ({ page, zoomLevel, onVisible, isFavorite }, ref) => {
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
      <div
        ref={internalRef}
        className="flex flex-col items-center w-full mb-2 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
        style={{ minHeight: !isVisible ? estimatedHeight : 'auto' }}
      >
        <div className="w-full flex justify-between items-center px-4 py-1 text-xs text-gray-500 bg-gray-200 dark:bg-gray-900">
          <span>Page {page.page_number}</span>
          {isFavorite && <RxStarFilled className="text-yellow-500" />}
        </div>
        
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
    );
  }
);

LazyPage.displayName = 'LazyPage';
