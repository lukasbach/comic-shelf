import React, { RefObject, useState, useLayoutEffect } from 'react';
import { ComicPage } from '../../types/comic';
import { RenderedPageImage } from './rendered-page-image';

type PageImageProps = {
  page: ComicPage;
  zoomLevel: number; // percentage: 100 = natural size
  fitMode: 'width' | 'both' | 'none';
  containerRef?: RefObject<HTMLDivElement | null>;
};

export const PageImage: React.FC<PageImageProps> = ({ page, zoomLevel, fitMode, containerRef }) => {
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  // Reset scroll position when page changes
  useLayoutEffect(() => {
    if (containerRef?.current) {
      containerRef.current.scrollTop = 0;
      containerRef.current.scrollLeft = 0;
    }
  }, [page.id, containerRef]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setNaturalSize({
      width: e.currentTarget.naturalWidth,
      height: e.currentTarget.naturalHeight,
    });
  };

  const isFitWidth = fitMode === 'width';
  const isFitBoth = fitMode === 'both';

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-auto flex justify-center ${isFitWidth ? 'items-start' : 'items-center'}`}
    >
      <RenderedPageImage
        page={page}
        alt={`Page ${page.page_number}`}
        className="max-sm:w-full"
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
          display: 'block',
        }}
      />
    </div>
  );
};
