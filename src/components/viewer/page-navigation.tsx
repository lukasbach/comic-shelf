import React, { useState, useEffect, useRef } from 'react';
import { RxChevronLeft, RxChevronRight, RxLayers, RxCross2 } from 'react-icons/rx';
import { FavoriteButton } from '../favorite-button';
import { ViewCounter } from '../view-counter';
import { ComicContextMenu } from '../comic-context-menu';
import { ComicPage } from '../../types/comic';
import { useSettings } from '../../contexts/settings-context';

type PageNavigationProps = {
  page?: ComicPage;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onGoToPage: (page: number) => void;
  isFavorite?: boolean;
  isViewed?: boolean;
  viewCount?: number;
  onToggleFavorite?: () => void;
  onToggleViewed?: () => void;
  onIncrementViewCount?: () => void;
  onDecrementViewCount?: () => void;
  isGallery?: boolean;
  onRemoveFromGallery?: () => void;
  onAddToGallery?: () => void;
  enableGalleries?: boolean;
};

export const PageNavigation: React.FC<PageNavigationProps> = ({
  page,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onGoToPage,
  isFavorite = false,
  isViewed = false,
  viewCount = 0,
  onToggleFavorite,
  onToggleViewed,
  onIncrementViewCount,
  onDecrementViewCount,
  isGallery,
  onRemoveFromGallery,
  onAddToGallery,
  enableGalleries,
}) => {
  const { settings } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(currentPage + 1));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(String(currentPage + 1));
  }, [currentPage]);

  const handlePageIndicatorClick = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    setInputValue(String(currentPage + 1));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(inputValue, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        onGoToPage(pageNum - 1);
        setIsEditing(false);
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(String(currentPage + 1));
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 py-2 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-4 border-r border-gray-200 dark:border-gray-800 pr-4">
        {enableGalleries && (
          <>
            {isGallery ? (
              <button
                onClick={onRemoveFromGallery}
                className="p-1.5 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-all border border-red-500/30"
                title="Remove from Gallery"
              >
                <RxCross2 size={18} />
              </button>
            ) : (
              <button
                onClick={onAddToGallery}
                className="p-1.5 bg-pink-600/10 text-pink-500 hover:bg-pink-600 hover:text-white rounded-lg transition-all border border-pink-500/30"
                title="Add to Gallery"
              >
                <RxLayers size={18} />
              </button>
            )}
          </>
        )}

        <button
          onClick={onPrevPage}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous Page"
        >
          <RxChevronLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="min-w-30 text-center">
        {isEditing ? (
          <div className="flex items-center justify-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className="w-12 px-1 text-center bg-gray-100 dark:bg-gray-800 text-foreground border-b-2 border-blue-500 outline-none"
            />
            <span className="text-sm font-medium">/ {totalPages}</span>
          </div>
        ) : (
          <button
            onClick={handlePageIndicatorClick}
            className="text-sm font-medium hover:text-blue-500 transition-colors px-2 py-1 rounded"
          >
            Page {currentPage + 1} / {totalPages}
          </button>
        )}
      </div>

      <button
        onClick={onNextPage}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Next Page"
      >
        <RxChevronRight className="w-6 h-6" />
      </button>

      {(onToggleFavorite || (onIncrementViewCount && settings.showViewCount)) && (
        <ComicContextMenu
          page={page}
          isFavorite={isFavorite}
          isViewed={isViewed}
          viewCount={viewCount}
          onToggleFavorite={onToggleFavorite}
          onToggleViewed={onToggleViewed}
          onIncrementViewCount={onIncrementViewCount}
          onDecrementViewCount={onDecrementViewCount}
        >
          <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200 dark:border-gray-800">
            {onToggleFavorite && (
              <FavoriteButton 
                isFavorite={isFavorite} 
                onToggle={onToggleFavorite} 
                size="md"
              />
            )}
            {onIncrementViewCount && (
              <ViewCounter 
                count={viewCount} 
                onIncrement={onIncrementViewCount} 
                size="md"
              />
            )}
          </div>
        </ComicContextMenu>
      )}
    </div>
  );
};
