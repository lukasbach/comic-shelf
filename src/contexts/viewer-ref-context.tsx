import React, { createContext, useContext, useRef, RefObject } from 'react';

type ViewerRefContextType = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  scrollToPage: (pageIndex: number, behavior?: ScrollBehavior) => void;
  registerScrollToPage: (fn: (pageIndex: number, behavior?: ScrollBehavior) => void) => void;
  nextPage: () => void;
  prevPage: () => void;
  registerNextPage: (fn: () => void) => void;
  registerPrevPage: (fn: () => void) => void;
};

const ViewerRefContext = createContext<ViewerRefContextType | undefined>(undefined);

export const ViewerRefProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollToPageFnRef = useRef<(pageIndex: number, behavior?: ScrollBehavior) => void>(() => {});
  const nextPageFnRef = useRef<() => void>(() => {});
  const prevPageFnRef = useRef<() => void>(() => {});

  const registerScrollToPage = (fn: (pageIndex: number, behavior?: ScrollBehavior) => void) => {
    scrollToPageFnRef.current = fn;
  };

  const registerNextPage = (fn: () => void) => {
    nextPageFnRef.current = fn;
  };

  const registerPrevPage = (fn: () => void) => {
    prevPageFnRef.current = fn;
  };

  const scrollToPage = (pageIndex: number, behavior: ScrollBehavior = 'auto') => {
    scrollToPageFnRef.current(pageIndex, behavior);
  };

  const nextPage = () => {
    nextPageFnRef.current();
  };

  const prevPage = () => {
    prevPageFnRef.current();
  };

  return (
    <ViewerRefContext.Provider value={{ 
      scrollContainerRef, 
      scrollToPage, 
      registerScrollToPage,
      nextPage,
      prevPage,
      registerNextPage,
      registerPrevPage
    }}>
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
