import React from 'react';
import { RxFileText, RxReload } from 'react-icons/rx';

export interface CardItemProps {
  title: string;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  imageUrl?: string | null;
  fallbackIcon?: React.ReactNode;
  onOpen: (e?: React.MouseEvent) => void;
  contextMenu?: (children: React.ReactNode) => React.ReactNode;
  topRightIcons?: React.ReactNode;
  bottomLeftIcons?: React.ReactNode;
  className?: string;
  isIndexing?: boolean;
  indexingLabel?: string;
  isFailed?: boolean;
  failedLabel?: string;
  failedTitle?: string;
  aspectRatio?: string;
  imageClassName?: string;
}

export const CardItem: React.FC<CardItemProps> = ({
  title,
  subtitle,
  footer,
  imageUrl,
  fallbackIcon = <RxFileText size={48} className="opacity-20" />,
  onOpen,
  contextMenu = (children) => <>{children}</>,
  topRightIcons,
  bottomLeftIcons,
  className = "",
  isIndexing = false,
  indexingLabel,
  isFailed = false,
  failedLabel = "Failed",
  failedTitle,
  aspectRatio = "aspect-3/4",
  imageClassName = "",
}) => {
  const content = (
    <div 
      className={`group flex flex-col bg-card rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-all cursor-pointer relative ${className}`}
      onClick={(e) => !isIndexing && onOpen(e)}
      onAuxClick={(e) => {
        if (e.button === 1 && !isIndexing) {
          onOpen(e);
        }
      }}
    >
      <div className={`relative ${aspectRatio} overflow-hidden bg-muted`}>
        {imageUrl && !isIndexing ? (
          <img 
            src={imageUrl} 
            alt={title} 
            className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${imageClassName}`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gray-100 dark:bg-gray-800">
            {isIndexing ? (
              <div className="flex flex-col items-center gap-2">
                <RxReload className="w-8 h-8 animate-spin text-blue-500" />
                {indexingLabel && (
                  <span className="text-[10px] font-medium uppercase tracking-wider">
                    {indexingLabel}
                  </span>
                )}
              </div>
            ) : (
              fallbackIcon
            )}
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-colors pointer-events-none" />

        {!isIndexing && !isFailed && topRightIcons && (
          <div 
            className="absolute top-2 right-2 flex flex-row-reverse items-center gap-1.5 z-10"
            onClick={(e) => e.stopPropagation()}
            onAuxClick={(e) => e.stopPropagation()}
          >
            {topRightIcons}
          </div>
        )}

        {!isIndexing && !isFailed && bottomLeftIcons && (
          <div 
            className="absolute bottom-2 left-2 flex gap-1 z-10"
            onClick={(e) => e.stopPropagation()}
            onAuxClick={(e) => e.stopPropagation()}
          >
            {bottomLeftIcons}
          </div>
        )}

        {isFailed && (
           <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 pointer-events-none">
              <div className="flex flex-col items-center gap-2 text-red-500">
                <RxFileText size={48} className="opacity-20" />
                <span className="text-[10px] font-medium uppercase tracking-wider">{failedLabel}</span>
              </div>
           </div>
        )}
        
        {isFailed && failedTitle && (
           <div className="absolute top-2 right-2 p-1" title={failedTitle}>
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white font-bold shadow-lg">!</div>
           </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 min-w-0">
        <h3 className="font-semibold text-sm truncate" title={title}>
          {title}
        </h3>
        {subtitle && (
          <div className="min-w-0">
            {subtitle}
          </div>
        )}
        {footer && (
          <div className="flex items-center justify-between mt-1">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return <>{contextMenu(content)}</>;
};

