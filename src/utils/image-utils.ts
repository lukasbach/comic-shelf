import { convertFileSrc } from '@tauri-apps/api/core';

/**
 * Converts a platform-native file path to a URL that can be used in the webview.
 */
export const getImageUrl = (filePath: string): string => convertFileSrc(filePath);

/**
 * Natural sort comparator for strings.
 * Properly handles numeric parts so that 'page2.jpg' comes before 'page10.jpg'.
 */
export const naturalSortComparator = (a: string, b: string): number => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

/**
 * Normalizes a path to use forward slashes.
 */
export const normalizePath = (p: string): string => p.replace(/\\/g, '/');
