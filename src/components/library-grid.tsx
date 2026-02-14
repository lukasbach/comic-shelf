import React from 'react';

type LibraryGridProps = {
  children: React.ReactNode;
};

export const LibraryGrid: React.FC<LibraryGridProps> = ({ children }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {children}
    </div>
  );
};
