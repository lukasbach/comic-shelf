import { Link } from '@tanstack/react-router'
const navItems = [
  { name: 'Explorer', to: '/library', icon: '📁' },
  { name: 'All Comics', to: '/library/list', icon: '📋' },
  { name: 'By Artist', to: '/library/artists', icon: '👤' },
  { name: 'Favorites', to: '/library/favorites', icon: '⭐' },
  { name: 'Search', to: '/library/search', icon: '🔍' },
]

export function LibrarySidebar() {
  return (
    <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 h-full flex flex-col">
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.to}
            activeProps={{
              className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
            }}
            inactiveProps={{
              className: 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800',
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors"
          >
            <span className="text-xl w-5 h-5 flex items-center justify-center">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  )
}
