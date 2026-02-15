import React from 'react';
import { RxStar, RxStarFilled } from 'react-icons/rx';

type FavoriteButtonProps = {
  isFavorite: boolean;
  onToggle: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  isFavorite,
  onToggle,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle(e);
      }}
      onAuxClick={(e) => {
        e.stopPropagation();
      }}
      className={`flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 ${className}`}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFavorite ? (
        <RxStarFilled className={`${sizeClasses[size]} text-yellow-400`} />
      ) : (
        <RxStar className={`${sizeClasses[size]} ${className.includes('text-') ? '' : 'text-gray-400'} hover:text-yellow-400`} />
      )}
    </button>
  );
};
