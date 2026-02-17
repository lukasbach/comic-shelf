import React from 'react';
import { Link, LinkProps } from '@tanstack/react-router';
import { NavigationContextMenu } from './navigation-context-menu';
import { useTabs } from '../contexts/tab-context';

export interface NavigationLinkProps extends Omit<LinkProps, 'ref'> {
  /**
   * Title to display in new tabs/windows. If not provided, will be inferred from the path.
   */
  title?: string;
  
  /**
   * If true, disables the context menu and middle-click behavior
   */
  disableContextMenu?: boolean;
  
  /**
   * Additional menu items to append to the context menu
   */
  extraMenuItems?: React.ReactNode;
  
  /**
   * Custom onClick handler (in addition to normal navigation)
   */
  onClick?: (e: React.MouseEvent) => void;
  
  /**
   * CSS class name
   */
  className?: string;
}

/**
 * A wrapper around TanStack Router's Link component that adds:
 * - Middle-click support to open in new tab
 * - Right-click context menu with "Open", "Open in new tab", "Open in new window"
 * 
 * Use this for all navigation links in the app to provide consistent behavior.
 * 
 * For cards with complex context menus (comics, galleries, pages), continue using
 * their specific context menu components (ComicContextMenu, etc.).
 */
export const NavigationLink = React.forwardRef<HTMLAnchorElement, NavigationLinkProps>(
  ({ 
    title, 
    disableContextMenu = false, 
    extraMenuItems, 
    onClick,
    className,
    children, 
    ...linkProps 
  }, ref) => {
    const { openLibraryTab } = useTabs();

    // Construct the full path including search params
    const getFullPath = () => {
      const basePath = typeof linkProps.to === 'string' ? linkProps.to : '/';
      const searchObj = linkProps.search && typeof linkProps.search === 'object' ? linkProps.search : {};
      if (!searchObj || Object.keys(searchObj).length === 0) {
        return basePath;
      }
      const searchStr = new URLSearchParams(
        Object.entries(searchObj).map(([k, v]) => [k, String(v)])
      ).toString();
      return `${basePath}?${searchStr}`;
    };

    const handleAuxClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.button === 1) { // Middle mouse button
        e.preventDefault();
        openLibraryTab(getFullPath(), title || 'Tab', true);
      }
    };

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (onClick) {
        onClick(e);
      }
    };

    const linkElement = (
      <Link
        ref={ref}
        {...linkProps}
        className={className}
        onAuxClick={handleAuxClick}
        onClick={handleClick}
      >
        {children}
      </Link>
    );

    if (disableContextMenu) {
      return linkElement;
    }

    // Extract search as object for NavigationContextMenu
    const searchObj = linkProps.search && typeof linkProps.search === 'object' ? linkProps.search : undefined;

    return (
      <NavigationContextMenu
        path={typeof linkProps.to === 'string' ? linkProps.to : '/'}
        search={searchObj as Record<string, any> | undefined}
        title={title}
        extraItems={extraMenuItems}
      >
        {linkElement}
      </NavigationContextMenu>
    );
  }
);

NavigationLink.displayName = 'NavigationLink';
