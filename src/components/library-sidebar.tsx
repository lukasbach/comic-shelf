import { FC } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  RxArchive,
  RxListBullet,
  RxPerson,
  RxStar,
  RxMagnifyingGlass,
  RxFileText,
  RxCounterClockwiseClock
} from 'react-icons/rx'
import { useTabs } from '../contexts/tab-context'
import { IndexingStatus } from './indexing-status'
import { useFavoriteComics } from '../hooks/use-favorite-comics'
import { useRecentlyOpened } from '../hooks/use-recently-opened'
import { useOpenComic } from '../hooks/use-open-comic'
import { useOpenComicPage } from '../hooks/use-open-comic-page'
import { ComicContextMenu } from './comic-context-menu'
import { getImageUrl } from '../utils/image-utils'
import type { Comic } from '../types/comic'
import type { RecentlyOpenedPage } from '../hooks/use-recently-opened'

const SmallCard: FC<{
  title: string
  thumbnail: string | null | undefined
  isActive?: boolean
  onClick: () => void
  onUpdate: () => void
  comic?: Comic
  page?: RecentlyOpenedPage
  subBadge?: string
}> = ({ title, thumbnail, isActive, onClick, onUpdate, comic, page, subBadge }) => {
  const coverUrl = thumbnail ? getImageUrl(thumbnail) : null

  const content = (
    <button
      onClick={onClick}
      title={title}
      className={`group flex flex-col gap-1 p-0.5 rounded transition-all text-left overflow-hidden w-full ${
        isActive
          ? 'bg-blue-100 dark:bg-blue-900 ring-1 ring-blue-200 dark:ring-blue-800'
          : 'hover:bg-gray-200 dark:hover:bg-gray-800'
      }`}
    >
      <div className="aspect-3/4 w-full relative rounded-sm overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-sm transition-transform group-hover:scale-[1.02]">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
            <RxFileText className="w-4 h-4" />
          </div>
        )}
        {isActive && <div className="absolute inset-0 bg-blue-500/10" />}
        {subBadge && (
          <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] px-1 rounded-tl-sm font-bold">
            {subBadge}
          </div>
        )}
      </div>
      <span
        className={`text-[9px] leading-[1.1] font-medium px-0.5 line-clamp-2 ${
          isActive
            ? 'text-blue-700 dark:text-blue-200'
            : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
        }`}
      >
        {title}
      </span>
    </button>
  )

  if (comic) {
    return <ComicContextMenu comic={comic} onUpdate={onUpdate}>{content}</ComicContextMenu>
  }

  if (page) {
    return <ComicContextMenu page={page} onUpdate={onUpdate}>{content}</ComicContextMenu>
  }

  return content
}

const navItems = [
  { name: 'Explorer', to: '/library', icon: RxArchive },
  { name: 'All Comics', to: '/library/list', icon: RxListBullet },
  { name: 'All Pages', to: '/library/all-pages', icon: RxFileText },
  { name: 'By Artist', to: '/library/artists', icon: RxPerson },
  { name: 'Favorites', to: '/library/favorites', icon: RxStar },
  { name: 'Search', to: '/library/search', icon: RxMagnifyingGlass },
]

export function LibrarySidebar() {
  const { openLibraryTab } = useTabs()
  const { comics: favoriteComics, refetch: refetchFavorites } = useFavoriteComics()
  const { comics: recentComics, pages: recentPages, refetch: refetchRecent } = useRecentlyOpened(6)
  const openComic = useOpenComic()
  const openComicPage = useOpenComicPage()
  const navigate = useNavigate()
  const { location } = useRouterState()

  const handleUpdate = () => {
    refetchFavorites()
    refetchRecent()
  }

  return (
    <div className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 h-full flex flex-col">
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.to}
            activeOptions={{ exact: true }}
            activeProps={{
              className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
            }}
            inactiveProps={{
              className: 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800',
            }}
            onAuxClick={(e) => {
              if (e.button === 1) { // Middle click
                e.preventDefault()
                // Create new tab and navigate to it
                openLibraryTab(item.to, item.name)
                navigate({ to: item.to as any })
              }
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors"
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {item.name}
          </Link>
        ))}

        {favoriteComics.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 mt-4">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Favorite Comics
            </div>
            <div className="grid grid-cols-3 gap-2 px-2 mt-1 pb-4">
              {favoriteComics.slice(0, 6).map((comic) => (
                <SmallCard
                  key={comic.id}
                  comic={comic}
                  title={comic.title}
                  thumbnail={comic.thumbnail_path}
                  isActive={location.pathname === `/viewer/${comic.id}`}
                  onClick={() => openComic(comic)}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          </div>
        )}

        {(recentComics.length > 0 || recentPages.length > 0) && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 mt-4">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <RxCounterClockwiseClock className="w-3.5 h-3.5" />
              Recently Opened
            </div>
            <div className="grid grid-cols-3 gap-2 px-2 mt-1 pb-4">
              {[
                ...recentComics.map(c => ({ type: 'comic' as const, data: c, date: c.last_opened_at })),
                ...recentPages.map(p => ({ type: 'page' as const, data: p, date: p.last_opened_at }))
              ]
                .sort((a, b) => {
                  const dateA = a.date ? new Date(a.date).getTime() : 0;
                  const dateB = b.date ? new Date(b.date).getTime() : 0;
                  return dateB - dateA;
                })
                .slice(0, 6)
                .map((item) => {
                  if (item.type === 'comic') {
                    const comic = item.data as typeof recentComics[0];
                    return (
                      <SmallCard
                        key={`recent-comic-${comic.id}`}
                        comic={comic}
                        title={comic.title}
                        thumbnail={comic.thumbnail_path}
                        isActive={location.pathname === `/viewer/${comic.id}`}
                        onClick={() => openComic(comic)}
                        onUpdate={handleUpdate}
                      />
                    );
                  } else {
                    const page = item.data as typeof recentPages[0];
                    return (
                      <SmallCard
                        key={`recent-page-${page.id}`}
                        page={page}
                        title={page.comic_title}
                        thumbnail={page.thumbnail_path}
                        subBadge={`P${page.page_number}`}
                        onClick={() => openComicPage(page.comic_id, page.page_number)}
                        onUpdate={handleUpdate}
                      />
                    );
                  }
                })}
            </div>
          </div>
        )}
      </nav>
      <IndexingStatus />
    </div>
  )
}
