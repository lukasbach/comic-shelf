import React, { useMemo, useState } from 'react';
import {
  RxMagnifyingGlass,
  RxArrowDown,
  RxArrowUp,
  RxStar,
  RxStarFilled,
  RxEyeOpen,
  RxEyeClosed,
  RxBookmark,
  RxBookmarkFilled,
  RxSymbol,
  RxCross2
} from 'react-icons/rx';
import { GridView } from './grid-view';
import { useSettings } from '../contexts/settings-context';

export type SortOrder = 'asc' | 'desc';
export type ViewFilter = 'all' | 'viewed' | 'not-viewed';
export type FavoriteFilter = 'all' | 'favorited' | 'not-favorited';
export type BookmarkFilter = 'all' | 'bookmarked' | 'not-bookmarked';

export interface SortOption<T> {
  label: string;
  value: string;
  comparator: (a: T, b: T) => number;
}

interface GridPageProps<T> {
  type: 'pages' | 'comics' | 'artists' | 'galleries';
  title: string;
  icon: React.ReactNode;
  items: T[];
  renderItem: (item: T, index: number, isFocused: boolean) => React.ReactNode;
  onActivateItem?: (item: T, index: number) => void;
  loading?: boolean;
  emptyMessage?: string;
  noItemsMessage?: string;
  
  // Searching
  searchPlaceholder?: string;
  searchFields?: (item: T) => (string | undefined | null)[];
  initialSearchQuery?: string;
  
  // Sorting
  sortOptions?: SortOption<T>[];
  defaultSortKey?: string;
  defaultSortOrder?: SortOrder;
  
  // Filtering capabilities
  showViewFilter?: boolean;
  showFavoriteFilter?: boolean;
  showBookmarkFilter?: boolean;
  
  // Property accessors for filtering
  isFavorite?: (item: T) => boolean;
  isViewed?: (item: T) => boolean;
  isBookmarked?: (item: T) => boolean;
  
  // Actions
  actions?: React.ReactNode;

  // Grid settings
  itemHeight?: number;
  focusedIndex?: number | null;
  onFocusedIndexChange?: (index: number | null) => void;
}

export function GridPage<T>({
  title,
  icon,
  items,
  renderItem,
  onActivateItem,
  loading = false,
  emptyMessage = "No items found matching your filters.",
  noItemsMessage = "No items found.",
  searchPlaceholder,
  searchFields,
  sortOptions = [],
  defaultSortKey,
  defaultSortOrder = 'asc',
  showViewFilter = false,
  showFavoriteFilter = false,
  showBookmarkFilter = false,
  isFavorite,
  isViewed,
  isBookmarked,
  actions,
  itemHeight,
  initialSearchQuery = '',
  focusedIndex,
  onFocusedIndexChange,
}: GridPageProps<T>) {
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  // Update search query when initialSearchQuery changes (e.g. navigation from artists)
  React.useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  const [sortKey, setSortKey] = useState(defaultSortKey || (sortOptions[0]?.value));
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder);
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [favoriteFilter, setFavoriteFilter] = useState<FavoriteFilter>('all');
  const [bookmarkFilter, setBookmarkFilter] = useState<BookmarkFilter>('all');

  const effectiveShowViewFilter = showViewFilter && settings.showViewCount;

  const toggleSortOrder = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (searchQuery && searchFields) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => {
        const fields = searchFields(item);
        return fields.some(f => f?.toLowerCase().includes(q));
      });
    }

    // View filter
    if (showViewFilter && isViewed) {
      if (viewFilter === 'viewed') result = result.filter(isViewed);
      else if (viewFilter === 'not-viewed') result = result.filter(i => !isViewed(i));
    }

    // Favorite filter
    if (showFavoriteFilter && isFavorite) {
      if (favoriteFilter === 'favorited') result = result.filter(isFavorite);
      else if (favoriteFilter === 'not-favorited') result = result.filter(i => !isFavorite(i));
    }

    // Bookmark filter
    if (showBookmarkFilter && isBookmarked) {
      if (bookmarkFilter === 'bookmarked') result = result.filter(isBookmarked);
      else if (bookmarkFilter === 'not-bookmarked') result = result.filter(i => !isBookmarked(i));
    }

    // Sort
    const currentSort = sortOptions.find(o => o.value === sortKey);
    if (currentSort) {
      result.sort((a, b) => {
        const cmp = currentSort.comparator(a, b);
        return sortOrder === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [
    items, 
    searchQuery, 
    searchFields, 
    sortKey, 
    sortOrder, 
    sortOptions, 
    viewFilter, 
    favoriteFilter, 
    bookmarkFilter,
    showViewFilter,
    showFavoriteFilter,
    showBookmarkFilter,
    isFavorite,
    isViewed,
    isBookmarked
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RxSymbol className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 text-center p-6">
        <div className="opacity-20">{icon && React.cloneElement(icon as React.ReactElement<any>, { size: 64 })}</div>
        <p className="text-lg font-medium">{noItemsMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-4 p-6 pb-4 border-b border-border/50 bg-background/50 backdrop-blur-md z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-primary">{icon}</div>
            <h1 className="text-2xl font-bold tracking-tight">
              {title}
              <span className="ml-3 text-sm font-normal text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                {filteredAndSortedItems.length}
              </span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative group flex-1 md:flex-none">
              <RxMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder={searchPlaceholder || `Search ${title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 pl-10 pr-10 py-2 bg-muted/50 border border-transparent focus:border-primary/50 focus:bg-muted focus:outline-none rounded-lg transition-all text-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RxCross2 />
                </button>
              )}
            </div>

            <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

            {/* Filter Buttons */}
            <div className="flex items-center bg-muted/30 p-1 rounded-lg border border-border/50">
              {showFavoriteFilter && (
                <button
                  onClick={() => setFavoriteFilter(prev => prev === 'all' ? 'favorited' : prev === 'favorited' ? 'not-favorited' : 'all')}
                  className={`p-1.5 rounded transition-all ${
                    favoriteFilter === 'favorited' ? 'bg-primary text-primary-foreground shadow-sm' : 
                    favoriteFilter === 'not-favorited' ? 'bg-muted-foreground/20 text-muted-foreground' : 
                    'hover:bg-muted text-muted-foreground'
                  }`}
                  title="Filter Favorites"
                >
                  {favoriteFilter === 'favorited' ? <RxStarFilled /> : <RxStar />}
                </button>
              )}
              {effectiveShowViewFilter && (
                <button
                  onClick={() => setViewFilter(prev => prev === 'all' ? 'viewed' : prev === 'viewed' ? 'not-viewed' : 'all')}
                  className={`p-1.5 rounded transition-all ${
                    viewFilter === 'viewed' ? 'bg-primary text-primary-foreground shadow-sm' : 
                    viewFilter === 'not-viewed' ? 'bg-muted-foreground/20 text-muted-foreground' : 
                    'hover:bg-muted text-muted-foreground'
                  }`}
                  title="Filter Viewed"
                >
                  {viewFilter === 'viewed' ? <RxEyeOpen /> : <RxEyeClosed />}
                </button>
              )}
              {showBookmarkFilter && (
                <button
                  onClick={() => setBookmarkFilter(prev => prev === 'all' ? 'bookmarked' : prev === 'bookmarked' ? 'not-bookmarked' : 'all')}
                  className={`p-1.5 rounded transition-all ${
                    bookmarkFilter === 'bookmarked' ? 'bg-primary text-primary-foreground shadow-sm' : 
                    bookmarkFilter === 'not-bookmarked' ? 'bg-muted-foreground/20 text-muted-foreground' : 
                    'hover:bg-muted text-muted-foreground'
                  }`}
                  title="Filter Bookmarks"
                >
                  {bookmarkFilter === 'bookmarked' ? <RxBookmarkFilled /> : <RxBookmark />}
                </button>
              )}
            </div>

            {/* Sort */}
            {sortOptions.length > 0 && (
              <div className="flex items-center bg-muted/30 p-1 rounded-lg border border-border/50">
                <select 
                  value={sortKey} 
                  onChange={(e) => setSortKey(e.target.value)}
                  className="bg-transparent text-sm font-medium px-2 py-1 outline-none cursor-pointer appearance-none"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-background">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={toggleSortOrder}
                  className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground"
                  title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
                >
                  {sortOrder === 'asc' ? <RxArrowUp /> : <RxArrowDown />}
                </button>
              </div>
            )}

            {actions && (
              <>
                <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
                {actions}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <GridView
          items={filteredAndSortedItems}
          onActivateItem={onActivateItem}
          renderItem={renderItem}
          emptyMessage={emptyMessage}
          itemHeight={itemHeight}
          focusedIndex={focusedIndex}
          onFocusedIndexChange={onFocusedIndexChange}
        />
      </div>
    </div>
  );
}
