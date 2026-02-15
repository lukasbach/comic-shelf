import React, { createContext, useContext, useRef, useCallback } from 'react';

type GridNavigationContextType = {
  moveFocus: (direction: 'up' | 'down' | 'left' | 'right') => void;
  activateFocus: () => void;
  registerGrid: (handlers: {
    moveFocus: (direction: 'up' | 'down' | 'left' | 'right') => void;
    activateFocus: () => void;
  }) => () => void;
};

const GridNavigationContext = createContext<GridNavigationContextType | undefined>(undefined);

export const GridNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const handlersRef = useRef<{
    moveFocus: (direction: 'up' | 'down' | 'left' | 'right') => void;
    activateFocus: () => void;
  } | null>(null);

  const registerGrid = useCallback((handlers: {
    moveFocus: (direction: 'up' | 'down' | 'left' | 'right') => void;
    activateFocus: () => void;
  }) => {
    handlersRef.current = handlers;
    return () => {
      if (handlersRef.current === handlers) {
        handlersRef.current = null;
      }
    };
  }, []);

  const moveFocus = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    handlersRef.current?.moveFocus(direction);
  }, []);

  const activateFocus = useCallback(() => {
    handlersRef.current?.activateFocus();
  }, []);

  return (
    <GridNavigationContext.Provider value={{ moveFocus, activateFocus, registerGrid }}>
      {children}
    </GridNavigationContext.Provider>
  );
};

export const useGridNavigation = () => {
  const context = useContext(GridNavigationContext);
  if (context === undefined) {
    throw new Error('useGridNavigation must be used within a GridNavigationProvider');
  }
  return context;
};
