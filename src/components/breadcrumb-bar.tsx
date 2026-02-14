import { Link, useRouterState } from '@tanstack/react-router'
import { RxChevronRight } from 'react-icons/rx'
import { useTabs } from '../contexts/tab-context'

export function BreadcrumbBar() {
  const { location } = useRouterState()
  const { tabs, activeTabId } = useTabs()
  
  const activeTab = tabs.find(t => t.id === activeTabId)
  const path = location.pathname

  const isLibrary = path.startsWith('/library')
  const isViewer = path.startsWith('/viewer')
  const isSettings = path.startsWith('/settings')

  const segments = [{ label: 'Library', to: '/library' }]

  if (isLibrary) {
    if (path.endsWith('/list')) segments.push({ label: 'All Comics', to: '/library/list' })
    else if (path.endsWith('/artists')) segments.push({ label: 'By Artist', to: '/library/artists' })
    else if (path.endsWith('/favorites')) segments.push({ label: 'Favorites', to: '/library/favorites' })
    else if (path.endsWith('/search')) segments.push({ label: 'Search', to: '/library/search' })
    else if (path === '/library' || path === '/library/') segments.push({ label: 'Explorer', to: '/library' })
  } else if (isViewer && activeTab && activeTab.type === 'comic') {
    // Basic segments for now, will be expanded when we have comic metadata
    segments.push({ label: activeTab.title, to: `/viewer/${activeTab.comicId}` })
    segments.push({ label: `Page ${(activeTab.currentPage ?? 0) + 1}`, to: location.pathname })
  } else if (isSettings) {
    segments.push({ label: 'Settings', to: '/settings' })
  }

  return (
    <nav className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
      {segments.map((segment, index) => (
        <div key={segment.label} className="flex items-center">
          {index > 0 && <RxChevronRight className="mx-2 text-gray-300 flex-shrink-0" />}
          <Link
            to={segment.to}
            className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
              index === segments.length - 1 ? 'text-gray-900 dark:text-gray-100 font-semibold' : ''
            }`}
          >
            {segment.label}
          </Link>
        </div>
      ))}
    </nav>
  )
}
