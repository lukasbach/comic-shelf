import { Link } from '@tanstack/react-router'
import { BreadcrumbBar } from './breadcrumb-bar'

export function TopBar() {
  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 z-20">
      <div className="flex items-center gap-4">
        <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mr-4">
          ComicView
        </div>
        <BreadcrumbBar />
      </div>
      <div className="flex items-center gap-2">
        <Link
          to="/settings"
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors"
          title="Settings"
        >
          <span className="text-xl">⚙️</span>
        </Link>
      </div>
    </header>
  )
}
