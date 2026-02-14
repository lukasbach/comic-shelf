import React, { createContext, useContext, useRef, RefObject } from 'react';

type ViewerRefContextType = {
  scrollContainerRef: RefObject<HTMLDivElement>;
  scrollToPage: (pageIndex: number, behavior?: ScrollBehavior) => void;
  registerScrollToPage: (fn: (pageIndex: number, behavior?: ScrollBehavior) => void) => void;
};

const ViewerRefContext = createContext<ViewerRefContextType | undefined>(undefined);

export const ViewerRefProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollToPageFnRef = useRef<(pageIndex: number, behavior?: ScrollBehavior) => void>(() => {});

  const registerScrollToPage = (fn: (pageIndex: number, behavior?: ScrollBehavior) => void) => {
    scrollToPageFnRef.current = fn;
  };

  const scrollToPage = (pageIndex: number, behavior: ScrollBehavior = 'auto') => {
    scrollToPageFnRef.current(pageIndex, behavior);
  };

  return (
    <ViewerRefContext.Provider value={{ scrollContainerRef, scrollToPage, registerScrollToPage }}>
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
