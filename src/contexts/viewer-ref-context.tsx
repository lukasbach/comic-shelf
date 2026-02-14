import React, { createContext, useContext, useRef, RefObject } from 'react';

type ViewerRefContextType = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
};

const ViewerRefContext = createContext<ViewerRefContextType | undefined>(undefined);

export const ViewerRefProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <ViewerRefContext.Provider value={{ scrollContainerRef }}>
      {children}
    </ViewerRefContext.Provider>
  );
};

export const useViewerRef = () => {
  const context = useContext(ViewerRefContext);
  if (context === undefined) {
    throw new Error('useViewerRef must be used within a ViewerRefProvider');
  }
  return context;
};
