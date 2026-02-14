import React, { useState, useEffect } from 'react';

type ScrollPageIndicatorProps = {
  currentPage: number;
  totalPages: number;
  isScrolling: boolean;
};

export const ScrollPageIndicator: React.FC<ScrollPageIndicatorProps> = ({
  currentPage,
  totalPages,
  isScrolling,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isScrolling) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isScrolling]);

  return (
    <div
      className={`fixed bottom-6 right-6 px-4 py-2 bg-black/60 backdrop-blur-md text-white rounded-full text-sm font-medium transition-opacity duration-500 pointer-events-none z-50 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      Page {currentPage + 1} / {totalPages}
    </div>
  );
};
