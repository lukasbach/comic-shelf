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

/**
 * Checks if a path is a sub-path of another path.
 * Handles trailing slashes and is case-insensitive on Windows.
 */
export const isSubPath = (base: string, sub: string): boolean => {
  const normBase = normalizePath(base);
  const normSub = normalizePath(sub);
  
  // On Windows, we should compare case-insensitively. 
  // For a more robust solution, we'd check the platform, but for now
  // let's assume case-insensitivity is generally safer for path prefix checks.
  const b = normBase.toLowerCase();
  const s = normSub.toLowerCase();
  
  if (s === b) return true;
  const prefix = b.endsWith('/') ? b : b + '/';
  return s.startsWith(prefix);
};
