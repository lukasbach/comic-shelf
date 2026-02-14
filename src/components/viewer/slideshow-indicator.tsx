import React, { useState } from 'react';
import { RxPlay, RxPause, RxStop, RxChevronUp, RxChevronDown } from 'react-icons/rx';
import { useSettings } from '../../contexts/settings-context';

type SlideshowIndicatorProps = {
  isActive: boolean;
  isPaused: boolean;
  progress: number; // 0-1
  onTogglePause: () => void;
  onStop: () => void;
  showProgress?: boolean;
};

export const SlideshowIndicator: React.FC<SlideshowIndicatorProps> = ({
  isActive,
  isPaused,
  progress,
  onTogglePause,
  onStop,
  showProgress = true,
}) => {
  const { settings, updateSettings } = useSettings();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 p-3 bg-black/80 backdrop-blur-lg rounded-lg border border-white/20 shadow-2xl min-w-[200px]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {isPaused ? (
            <RxPause className="text-yellow-400 animate-pulse" />
          ) : (
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
          )}
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Slideshow
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/10 rounded-md transition-colors text-white"
            title={isExpanded ? "Show Less" : "Show Settings"}
          >
            {isExpanded ? <RxChevronDown size={18} /> : <RxChevronUp size={18} />}
          </button>
          <button
            onClick={onTogglePause}
            className="p-1 hover:bg-white/10 rounded-md transition-colors text-white"
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <RxPlay size={18} /> : <RxPause size={18} />}
          </button>
          <button
            onClick={onStop}
            className="p-1 hover:bg-red-500/20 rounded-md transition-colors text-red-500"
            title="Stop Slideshow"
          >
            <RxStop size={18} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-3 pt-2 mt-1 border-t border-white/10">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-400 uppercase font-bold">Delay: {settings.slideshowDelay}ms</label>
            <input 
              type="range" 
              min="1000" 
              max="20000" 
              step="500"
              value={settings.slideshowDelay}
              onChange={(e) => updateSettings({ slideshowDelay: parseInt(e.target.value) })}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-gray-400 uppercase font-bold cursor-pointer" htmlFor="autoscroll-toggle">
              Auto-Scroll
            </label>
            <input 
              id="autoscroll-toggle"
              type="checkbox"
              checked={settings.slideshowAutoScroll}
              onChange={(e) => updateSettings({ slideshowAutoScroll: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 bg-black/50"
            />
          </div>
        </div>
      )}

      {showProgress && !isPaused && (
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
          <div 
            className="h-full bg-blue-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};
