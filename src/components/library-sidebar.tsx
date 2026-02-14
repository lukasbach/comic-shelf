import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
    RxArchive,
    RxListBullet,
    RxPerson,
    RxStar,
    RxMagnifyingGlass,
    RxFileText
} from 'react-icons/rx'
import { useTabs } from '../contexts/tab-context'
import { IndexingStatus } from './indexing-status'
import { useFavoriteComics } from '../hooks/use-favorite-comics'
import { useOpenComic } from '../hooks/use-open-comic'
import { ComicContextMenu } from './comic-context-menu'
import { getImageUrl } from '../utils/image-utils'

const navItems = [
  { name: 'Explorer', to: '/library', icon: RxArchive },
  { name: 'All Comics', to: '/library/list', icon: RxListBullet },
  { name: 'By Artist', to: '/library/artists', icon: RxPerson },
  { name: 'Favorites', to: '/library/favorites', icon: RxStar },
  { name: 'Search', to: '/library/search', icon: RxMagnifyingGlass },
]

export function LibrarySidebar() {
  const { openLibraryTab } = useTabs()
  const { comics: favoriteComics, refetch } = useFavoriteComics()
  const openComic = useOpenComic()
  const navigate = useNavigate()
  const { location } = useRouterState()

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
            <div className="grid grid-cols-2 gap-2 px-2 mt-1 pb-4">
              {favoriteComics.map((comic) => {
                const isActive = location.pathname === `/viewer/${comic.id}`
                const coverUrl = comic.thumbnail_path ? getImageUrl(comic.thumbnail_path) : null;
                
                return (
                  <ComicContextMenu key={comic.id} comic={comic} onUpdate={refetch}>
                    <button
                      onClick={() => openComic(comic)}
                      title={comic.title}
                      className={`group flex flex-col gap-1.5 p-1 rounded-md transition-all text-left overflow-hidden ${
                        isActive
                          ? 'bg-blue-100 dark:bg-blue-900 ring-1 ring-blue-200 dark:ring-blue-800'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="aspect-[3/4] w-full relative rounded-sm overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-sm transition-transform group-hover:scale-[1.02]">
                        {coverUrl ? (
                          <img 
                            src={coverUrl} 
                            alt={comic.title} 
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                            <RxFileText className="w-6 h-6" />
                          </div>
                        )}
                        {isActive && (
                          <div className="absolute inset-0 bg-blue-500/10" />
                        )}
                      </div>
                      <span className={`text-[10px] leading-tight font-medium px-0.5 line-clamp-2 ${
                        isActive 
                          ? 'text-blue-700 dark:text-blue-200' 
                          : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
                      }`}>
                        {comic.title}
                      </span>
                    </button>
                  </ComicContextMenu>
                )
              })}
            </div>
          </div>
        )}
      </nav>
      <IndexingStatus />
    </div>
  )
}
