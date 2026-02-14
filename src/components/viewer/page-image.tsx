import React, { RefObject } from 'react';
import { ComicPage } from '../../types/comic';
import { RenderedPageImage } from './rendered-page-image';

type PageImageProps = {
  page: ComicPage;
  zoomLevel: number; // percentage: 100 = fit width, >100 = zoomed in
  containerRef?: RefObject<HTMLDivElement | null>;
};

export const PageImage: React.FC<PageImageProps> = ({ page, zoomLevel, containerRef }) => {
  const isFitWidth = zoomLevel === 100;

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-auto flex justify-center ${isFitWidth ? 'items-start' : ''}`}
    >
      <RenderedPageImage
        page={page}
        alt={`Page ${page.page_number}`}
        className="max-sm:w-full"
        style={{
          width: isFitWidth ? '100%' : `${zoomLevel}%`,
          height: 'auto',
          maxWidth: isFitWidth ? '100%' : 'none',
          display: 'block',
        }}
      />
    </div>
  );
};
