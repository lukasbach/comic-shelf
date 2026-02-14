import React, { useState, useMemo } from 'react';
import { RxChevronDown, RxChevronRight, RxArchive, RxFileText } from 'react-icons/rx';
import type { Comic, IndexPath } from '../types/comic';
import { getImageUrl, normalizePath } from '../utils/image-utils';

type TreeNode = {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  comics: Comic[];
};

type FileTreeProps = {
  comics: Comic[];
  indexPaths: IndexPath[];
  onOpenComic: (comic: Comic) => void;
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
    // Find the longest matching root path
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

const TreeItem: React.FC<{ 
    node: TreeNode; 
    depth: number; 
    onOpenComic: (comic: Comic) => void;
}> = ({ node, depth, onOpenComic }) => {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const hasChildren = node.children.size > 0 || node.comics.length > 0;

  const sortedChildren = useMemo(() => 
    Array.from(node.children.values()).sort((a, b) => a.name.localeCompare(b.name)),
    [node.children]
  );

  const sortedComics = useMemo(() => 
    [...node.comics].sort((a, b) => a.title.localeCompare(b.title)),
    [node.comics]
  );

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 py-1 px-2 hover:bg-muted rounded text-sm group transition-colors"
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
      >
        <span className="text-muted-foreground">
          {isExpanded ? <RxChevronDown /> : <RxChevronRight />}
        </span>
        <RxArchive className="text-blue-400" />
        <span className="truncate font-medium">{node.name}</span>
        {hasChildren && (
            <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                ({node.children.size + node.comics.length})
            </span>
        )}
      </button>

      {isExpanded && (
        <div className="flex flex-col">
          {sortedChildren.map((child) => (
            <TreeItem 
              key={child.name} 
              node={child} 
              depth={depth + 1} 
              onOpenComic={onOpenComic} 
            />
          ))}
          {sortedComics.map((comic) => (
            <div
              key={comic.id}
              onClick={() => onOpenComic(comic)}
              className="flex items-center gap-2 py-2 px-2 hover:bg-muted rounded text-sm cursor-pointer transition-colors"
              style={{ paddingLeft: `${(depth + 1) * 1.5 + 0.5}rem` }}
            >
              <div className="w-8 h-10 bg-muted rounded overflow-hidden flex-shrink-0 border border-border">
                {comic.thumbnail_path ? (
                  <img src={getImageUrl(comic.thumbnail_path)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <RxFileText size={16} />
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate font-medium">{comic.title}</span>
                <span className="truncate text-[10px] text-muted-foreground">
                    {comic.artist || 'Unknown Artist'} • {comic.page_count}P
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ comics, indexPaths, onOpenComic }) => {
  const tree = useMemo(() => buildTree(comics, indexPaths), [comics, indexPaths]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      {tree.map((root) => (
        <TreeItem 
            key={root.path} 
            node={root} 
            depth={0} 
            onOpenComic={onOpenComic} 
        />
      ))}
    </div>
  );
};
