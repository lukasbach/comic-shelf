import React, { useState } from 'react';
import { RxEyeOpen, RxPlus } from 'react-icons/rx';
import { useSettings } from '../contexts/settings-context';

type ViewCounterProps = {
  count: number;
  onIncrement: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export const ViewCounter: React.FC<ViewCounterProps> = ({
  count,
  onIncrement,
  size = 'md',
  className = '',
}) => {
  const { settings } = useSettings();
  const [isAnimating, setIsAnimating] = useState(false);

  if (!settings.showViewCount) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIncrement(e);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const sizeClasses = {
    sm: 'text-xs p-1 gap-1',
    md: 'text-sm p-1.5 gap-1.5',
    lg: 'text-base p-2 gap-2',
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  return (
    <div className={`flex items-center bg-black/40 backdrop-blur-sm rounded-full text-white ${sizeClasses[size]} ${className}`}>
      <div className="flex items-center gap-1 opacity-80">
        <RxEyeOpen size={iconSizes[size]} />
        <span className={`font-medium transition-all duration-300 ${isAnimating ? 'text-green-400 scale-110' : ''}`}>
          {count}
        </span>
      </div>
      <button
        onClick={handleClick}
        onAuxClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition-colors"
        aria-label="Increment view count"
      >
        <RxPlus size={iconSizes[size]} />
      </button>
    </div>
  );
};
