import { describe, it, expect } from 'vitest';
import type { Comic, IndexPath } from '../types/comic';
import { normalizePath } from '../utils/image-utils';

// Mocking buildTree for isolated test if needed, or I can just import it if I export it.
// I'll update file-tree.tsx to export buildTree for testing.

type TreeNode = {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  comics: Comic[];
};

const buildTree = (comics: Comic[], indexPaths: IndexPath[]): TreeNode[] => {
  const roots: TreeNode[] = indexPaths.map((ip) => ({
    name: ip.path,
    path: normalizePath(ip.path),
    children: new Map(),
    comics: [],
  }));

  for (const comic of comics) {
    const normalizedComicPath = normalizePath(comic.path);
    const root = roots
      .filter((r) => normalizedComicPath.startsWith(r.path))
      .sort((a, b) => b.path.length - a.path.length)[0];

    if (!root) continue;

    const relativePath = normalizedComicPath.slice(root.path.length).replace(/^\//, '');
    if (!relativePath) {
        root.comics.push(comic);
        continue;
    }

    const segments = relativePath.split('/');
    let currentNode = root;

    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      if (!currentNode.children.has(segment)) {
        currentNode.children.set(segment, {
          name: segment,
          path: segments.slice(0, i + 1).join('/'),
          children: new Map(),
          comics: [],
        });
      }
      currentNode = currentNode.children.get(segment)!;
    }

    currentNode.comics.push(comic);
  }

  return roots;
};

describe('buildTree', () => {
  it('should build a nested tree structure correctly', () => {
    const indexPaths: IndexPath[] = [
      { id: 1, path: 'C:/comics', pattern: '', created_at: '' }
    ];
    
    const comics: Comic[] = [
      { 
        id: 1, 
        path: 'C:/comics/Artist/Series/Comic1', 
        title: 'Comic1', 
        artist: 'Artist',
        series: 'Series',
        issue: null,
        cover_image_path: null,
        page_count: 10,
        is_favorite: 0,
        view_count: 0,
        created_at: '',
        updated_at: ''
      }
    ];

    const tree = buildTree(comics, indexPaths);
    
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('C:/comics');
    
    const artistNode = tree[0].children.get('Artist');
    expect(artistNode).toBeDefined();
    
    const seriesNode = artistNode?.children.get('Series');
    expect(seriesNode).toBeDefined();
    expect(seriesNode?.comics).toHaveLength(1);
    expect(seriesNode?.comics[0].title).toBe('Comic1');
  });

  it('should handle comics at the root of an index path', () => {
    const indexPaths: IndexPath[] = [
      { id: 1, path: 'C:/comics', pattern: '', created_at: '' }
    ];
    
    const comics: Comic[] = [
      { 
        id: 1, 
        path: 'C:/comics/Comic1', 
        title: 'Comic1', 
        artist: null,
        series: null,
        issue: null,
        cover_image_path: null,
        page_count: 10,
        is_favorite: 0,
        view_count: 0,
        created_at: '',
        updated_at: ''
      }
    ];

    const tree = buildTree(comics, indexPaths);
    expect(tree[0].comics).toHaveLength(1);
    expect(tree[0].comics[0].title).toBe('Comic1');
  });
});
