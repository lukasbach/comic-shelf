import React from 'react';
import { Comic } from '../../types/comic';
import { RxGrid, RxFile, RxRows, RxPlay, RxPause } from 'react-icons/rx';

type ViewerHeaderProps = {
  comic: Comic;
  pageCount: number;
  currentMode: 'overview' | 'single' | 'scroll';
  onModeChange: (mode: 'overview' | 'single' | 'scroll') => void;
  isSlideshowActive?: boolean;
  isSlideshowPaused?: boolean;
  onToggleSlideshow?: () => void;
};

export const ViewerHeader: React.FC<ViewerHeaderProps> = ({
  comic,
  pageCount,
  currentMode,
  onModeChange,
  isSlideshowActive = false,
  isSlideshowPaused = false,
  onToggleSlideshow,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-12">
      <div className="flex items-center gap-3 overflow-hidden">
        <h2 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-[400px]" title={comic.title}>
          {comic.title}
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {pageCount} {pageCount === 1 ? 'page' : 'pages'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {onToggleSlideshow && currentMode !== 'overview' && (
          <button
            onClick={onToggleSlideshow}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
              isSlideshowActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
            title={isSlideshowActive ? (isSlideshowPaused ? 'Resume Slideshow' : 'Pause Slideshow') : 'Start Slideshow'}
          >
            {isSlideshowActive && !isSlideshowPaused ? <RxPause className="w-3.5 h-3.5" /> : <RxPlay className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Slideshow</span>
          </button>
        )}

        <div className="flex items-center bg-gray-200 dark:bg-gray-800 p-0.5 rounded-md">
          <button
            onClick={() => onModeChange('overview')}
            className={`p-1.5 rounded-md transition-all ${
              currentMode === 'overview'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            title="Overview Mode"
          >
            <RxGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onModeChange('single')}
            className={`p-1.5 rounded-md transition-all ${
              currentMode === 'single'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            title="Single Page Mode"
          >
            <RxFile className="w-4 h-4" />
          </button>
          <button
            onClick={() => onModeChange('scroll')}
            className={`p-1.5 rounded-md transition-all ${
              currentMode === 'scroll'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            title="Scroll Mode"
          >
            <RxRows className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
