import React, { useState, useEffect, useRef } from 'react';
import { RxChevronLeft, RxChevronRight } from 'react-icons/rx';

type PageNavigationProps = {
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onGoToPage: (page: number) => void;
};

export const PageNavigation: React.FC<PageNavigationProps> = ({
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onGoToPage,
}) => {
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
      <button
        onClick={onPrevPage}
        disabled={currentPage <= 0}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous Page"
      >
        <RxChevronLeft className="w-6 h-6" />
      </button>

      <div className="min-w-[120px] text-center">
        {isEditing ? (
          <div className="flex items-center justify-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className="w-12 px-1 text-center bg-gray-100 dark:bg-gray-800 border-b-2 border-blue-500 outline-none"
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
        disabled={currentPage >= totalPages - 1}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Next Page"
      >
        <RxChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};
