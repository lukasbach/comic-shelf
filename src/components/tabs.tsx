import React from 'react';

export type TabItem = {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
};

type TabsProps = {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

export const Tabs: React.FC<TabsProps> = ({ items, activeId, onChange, className = '' }) => {
  return (
    <div className={`flex items-center border-b border-border w-full ${className}`}>
      <div className="flex gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`
              relative flex items-center gap-2 px-4 py-3 rounded-t-lg text-sm font-semibold 
              transition-all cursor-pointer bg-transparent border-none shadow-none
              hover:bg-muted hover:text-foreground
              ${activeId === item.id 
                ? 'text-primary' 
                : 'text-muted-foreground'}
            `}
          >
            <span className="relative z-10 flex items-center gap-2">
              {item.icon}
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span className={`
                  text-[10px] px-1.5 py-0.5 rounded-full transition-colors
                  ${activeId === item.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted-foreground/10 text-muted-foreground'}
                `}>
                  {item.count}
                </span>
              )}
            </span>

            {/* Active Bottom Bar - Small, fat, rounded */}
            {activeId === item.id && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
