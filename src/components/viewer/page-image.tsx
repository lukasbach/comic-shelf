import React, { RefObject, useState } from 'react';
import { ComicPage } from '../../types/comic';
import { RenderedPageImage } from './rendered-page-image';

type PageImageProps = {
  page: ComicPage;
  zoomLevel: number; // percentage: 100 = natural size
  fitMode: 'width' | 'none';
  containerRef?: RefObject<HTMLDivElement | null>;
};

export const PageImage: React.FC<PageImageProps> = ({ page, zoomLevel, fitMode, containerRef }) => {
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setNaturalSize({
      width: e.currentTarget.naturalWidth,
      height: e.currentTarget.naturalHeight,
    });
  };

  const isFitWidth = fitMode === 'width';

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
            : naturalSize 
              ? `${(naturalSize.width * zoomLevel) / 100}px` 
              : 'auto',
          height: 'auto',
          maxWidth: isFitWidth ? '100%' : 'none',
          display: 'block',
        }}
      />
    </div>
  );
};
