import React from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { RxExternalLink, RxOpenInNewWindow } from 'react-icons/rx';
import { useTabs } from '../contexts/tab-context';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

export interface NavigationContextMenuProps {
  /**
   * The path to navigate to (e.g., "/library/list" or "/settings")
   */
  path: string;
  
  /**
   * Optional search params as an object (e.g., { path: "/some/folder" })
   */
  search?: Record<string, any>;
  
  /**
   * Title to display in the new tab
   */
  title?: string;
  
  /**
   * Callback for normal navigation (optional - will use default if not provided)
   */
  onOpen?: () => void;
  
  /**
   * The children to wrap with the context menu
   */
  children: React.ReactNode;
  
  /**
   * Additional menu items to append to the context menu
   */
  extraItems?: React.ReactNode;
}

/**
 * A generic context menu wrapper for navigation elements.
 * Provides "Open", "Open in new tab", and "Open in new window" options.
 */
export const NavigationContextMenu: React.FC<NavigationContextMenuProps> = ({ 
  path, 
  search,
  title,
  onOpen,
  children,
  extraItems
}) => {
  const { openLibraryTab } = useTabs();

  // Build full path with search params
  const getFullPath = () => {
    if (!search || Object.keys(search).length === 0) return path;
    const searchStr = new URLSearchParams(
      Object.entries(search).map(([k, v]) => [k, String(v)])
    ).toString();
    return `${path}?${searchStr}`;
  };

  // Get a sensible title from the path if not provided
  const getTitle = () => {
    if (title) return title;
    if (path === '/library') return 'Explorer';
    if (path === '/library/list') return 'All Comics';
    if (path === '/library/all-pages') return 'All Pages';
    if (path === '/library/artists') return 'Artists';
    if (path === '/library/favorites') return 'Favorites';
    if (path === '/library/galleries') return 'Galleries';
    if (path === '/settings') return 'Settings';
    return 'Library';
  };

  const handleOpen = () => {
    if (onOpen) {
      onOpen();
    }
    // Default behavior is handled by the Link component itself
  };

  const handleOpenInNewTab = () => {
    openLibraryTab(getFullPath(), getTitle(), true);
  };

  const handleOpenInNewWindow = async () => {
    const fullPath = getFullPath();
    const label = `window-${Date.now()}`;
    
    console.log(`Opening new window: ${label} with URL: ${fullPath}`);
    
    try {
      const webview = new WebviewWindow(label, {
        url: fullPath,
        title: `Comic Shelf - ${getTitle()}`,
        width: 1280,
        height: 800,
        center: true,
        decorations: false,
      });

      webview.once('tauri://error', (e) => {
        console.error('Failed to create window:', e);
      });
    } catch (e) {
      console.error('Failed to create window:', e);
    }
  };

  const itemClass = "flex items-center gap-2 px-2 py-1.5 text-sm outline-none cursor-default hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm transition-colors text-gray-700 dark:text-gray-200";
  const separatorClass = "h-px bg-gray-200 dark:bg-gray-700 my-1";

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content 
          className="min-w-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg p-1 z-100"
          onClick={(e) => e.stopPropagation()}
          onAuxClick={(e) => e.stopPropagation()}
        >
          <ContextMenu.Item className={itemClass} onSelect={handleOpen}>
            <RxExternalLink className="w-4 h-4" />
            <span>Open</span>
          </ContextMenu.Item>
          
          <ContextMenu.Item className={itemClass} onSelect={handleOpenInNewTab}>
            <RxExternalLink className="w-4 h-4" />
            <span>Open in new tab</span>
          </ContextMenu.Item>
          
          <ContextMenu.Item className={itemClass} onSelect={handleOpenInNewWindow}>
            <RxOpenInNewWindow className="w-4 h-4" />
            <span>Open in new window</span>
          </ContextMenu.Item>

          {extraItems && (
            <>
              <ContextMenu.Separator className={separatorClass} />
              {extraItems}
            </>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};
