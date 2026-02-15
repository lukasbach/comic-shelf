import React from 'react';
import { VirtualizedGrid } from './virtualized-grid';

interface GridViewProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
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
}

export function GridView<T>({
  items,
  renderItem,
  emptyMessage,
  virtualized = true,
  itemHeight,
  gap = 16,
  padding = 0,
  className = "",
  columnsMap = {
    xl: 6,
    lg: 5,
    md: 4,
    sm: 3,
    default: 2,
  },
}: GridViewProps<T>) {
  if (items.length === 0 && emptyMessage) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400 dark:text-gray-600 italic">
        {emptyMessage}
      </div>
    );
  }

  if (virtualized) {
    return (
      <VirtualizedGrid
        items={items}
        renderItem={renderItem}
        itemHeight={itemHeight}
        gap={gap}
        padding={padding}
        className={className}
        columnsMap={columnsMap}
      />
    );
  }

  return (
    <div 
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 ${className}`}
      style={{
        gap: `${gap}px`,
        padding: `${padding}px`,
      }}
    >
      {items.map((item, index) => renderItem(item, index))}
    </div>
  );
}
