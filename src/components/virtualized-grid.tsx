import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number; // Estimated height per row
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

export function VirtualizedGrid<T>({
  items,
  renderItem,
  itemHeight = 450, // Default estimate for comic/page card + info
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
}: VirtualizedGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(columnsMap.default || 2);

  // We need to calculate how many columns we have based on the container width
  // to group items into rows.
  useEffect(() => {
    if (!parentRef.current) return;

    const updateColumns = () => {
      if (!parentRef.current) return;
      const width = parentRef.current.clientWidth;
      
      // Matching Tailwind breakpoints
      if (width >= 1280) setColumns(columnsMap.xl || 6);      // xl
      else if (width >= 1024) setColumns(columnsMap.lg || 5); // lg
      else if (width >= 768) setColumns(columnsMap.md || 4);  // md
      else if (width >= 640) setColumns(columnsMap.sm || 3);  // sm
      else setColumns(columnsMap.default || 2);              // default
    };

    const resizeObserver = new ResizeObserver(updateColumns);
    resizeObserver.observe(parentRef.current);
    updateColumns();

    return () => resizeObserver.disconnect();
  }, []);

  const rows = useMemo(() => {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += columns) {
      result.push(items.slice(i, i + columns));
    }
    return result;
  }, [items, columns]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight + gap,
    overscan: 5,
    // Measure actual row height to handle dynamic card heights and prevent overlap
    measureElement: (el) => {
      return el.getBoundingClientRect().height;
    }
  });

  return (
    <div
      ref={parentRef}
      className={`h-full overflow-auto ${className}`}
      style={{
        padding: `${padding}px`,
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gap: `${gap}px`,
              paddingBottom: `${gap}px`,
            }}
          >
            {rows[virtualRow.index].map((item, colIndex) => (
              <div key={colIndex}>
                {renderItem(item, virtualRow.index * columns + colIndex)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
