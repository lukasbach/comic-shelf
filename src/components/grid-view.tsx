import React, { useState, useEffect, useCallback } from 'react';
import { VirtualizedGrid } from './virtualized-grid';
import { useGridNavigation } from '../contexts/grid-navigation-context';

interface GridViewProps<T> {
  items: T[];
  renderItem: (item: T, index: number, isFocused: boolean) => React.ReactNode;
  emptyMessage?: React.ReactNode;
  virtualized?: boolean;
  itemHeight?: number;
  gap?: number;
  padding?: number;
  className?: string;
  columnsMap?: {
    xl?: number;
    lg?: number;
    md?: number;
    sm?: number;
    default?: number;
  };
  focusedIndex?: number | null;
  onFocusedIndexChange?: (index: number | null) => void;
  onActivateItem?: (item: T, index: number) => void;
}

export function GridView<T>({
  items,
  renderItem,
  emptyMessage,
  virtualized = true,
  itemHeight,
  gap = 24,
  padding = 24,
  className = "",
  columnsMap = {
    xl: 6,
    lg: 5,
    md: 4,
    sm: 3,
    default: 2,
  },
  focusedIndex,
  onFocusedIndexChange,
  onActivateItem,
}: GridViewProps<T>) {
  const { registerGrid } = useGridNavigation();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [internalFocusedIndex, setInternalFocusedIndex] = useState<number | null>(null);
  const [columns, setColumns] = useState(columnsMap.default || 2);

  const actualFocusedIndex = focusedIndex !== undefined ? focusedIndex : internalFocusedIndex;

  // Track columns to support up/down navigation
  useEffect(() => {
    if (!containerRef.current) return;

    const updateColumns = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      
      // Matching Tailwind breakpoints roughly
      if (width >= 1280) setColumns(columnsMap.xl || 6);
      else if (width >= 1024) setColumns(columnsMap.lg || 5);
      else if (width >= 768) setColumns(columnsMap.md || 4);
      else if (width >= 640) setColumns(columnsMap.sm || 3);
      else setColumns(columnsMap.default || 2);
    };

    updateColumns();
    const resizeObserver = new ResizeObserver(updateColumns);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [columnsMap]);

  const moveFocus = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (items.length === 0) return;
    
    let nextIndex = actualFocusedIndex ?? 0;
    
    if (actualFocusedIndex === null) {
      if (onFocusedIndexChange) onFocusedIndexChange(0);
      else setInternalFocusedIndex(0);
      return;
    }
    
    switch (direction) {
      case 'left':
        nextIndex = Math.max(0, nextIndex - 1);
        break;
      case 'right':
        nextIndex = Math.min(items.length - 1, nextIndex + 1);
        break;
      case 'up':
        nextIndex = Math.max(0, nextIndex - columns);
        break;
      case 'down':
        nextIndex = Math.min(items.length - 1, nextIndex + columns);
        break;
    }
    
    if (nextIndex !== actualFocusedIndex) {
      if (onFocusedIndexChange) {
        onFocusedIndexChange(nextIndex);
      } else {
        setInternalFocusedIndex(nextIndex);
      }
    }
  }, [items.length, actualFocusedIndex, columns, onFocusedIndexChange]);

  const activateFocus = useCallback(() => {
    if (actualFocusedIndex !== null && actualFocusedIndex < items.length) {
      onActivateItem?.(items[actualFocusedIndex], actualFocusedIndex);
    }
  }, [actualFocusedIndex, items, onActivateItem]);

  useEffect(() => {
    return registerGrid({ moveFocus, activateFocus });
  }, [registerGrid, moveFocus, activateFocus]);

  if (items.length === 0 && emptyMessage) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400 dark:text-gray-600 italic">
        {emptyMessage}
      </div>
    );
  }

  const renderGridItem = (item: T, index: number) => {
    return renderItem(item, index, index === actualFocusedIndex);
  };

  if (virtualized) {
    return (
      <div ref={containerRef} className="h-full w-full overflow-hidden">
        <VirtualizedGrid
          items={items}
          renderItem={renderGridItem}
          itemHeight={itemHeight}
          gap={gap}
          padding={padding}
          className={className}
          columnsMap={columnsMap}
          scrollToIndex={actualFocusedIndex}
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 ${className}`}
      style={{
        gap: `${gap}px`,
        padding: `${padding}px`,
      }}
    >
      {items.map((item, index) => renderGridItem(item, index))}
    </div>
  );
}
