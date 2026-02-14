import { Link, useNavigate } from '@tanstack/react-router'
import {
    RxArchive,
    RxListBullet,
    RxPerson,
    RxStar,
    RxMagnifyingGlass
} from 'react-icons/rx'
import { useTabs } from '../contexts/tab-context'
import { IndexingStatus } from './indexing-status'

const navItems = [
  { name: 'Explorer', to: '/library', icon: RxArchive },
  { name: 'All Comics', to: '/library/list', icon: RxListBullet },
  { name: 'By Artist', to: '/library/artists', icon: RxPerson },
  { name: 'Favorites', to: '/library/favorites', icon: RxStar },
  { name: 'Search', to: '/library/search', icon: RxMagnifyingGlass },
]

export function LibrarySidebar() {
  const { openLibraryTab } = useTabs()
  const navigate = useNavigate()

  return (
    <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 h-full flex flex-col">
      <nav className="flex-1 p-4 space-y-1">
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
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.name}
          </Link>
        ))}
      </nav>
      <IndexingStatus />
    </div>
  )
}
