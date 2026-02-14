import { Link, useNavigate } from '@tanstack/react-router'
import { useTabs } from '../contexts/tab-context'
import { RxCross2 } from 'react-icons/rx'

export function TabBar() {
  const { tabs, activeTabId, closeTab } = useTabs()
  const navigate = useNavigate()

  if (tabs.length === 0) return null

  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            className={`flex items-center group min-w-[120px] max-w-[240px] border-r border-gray-200 dark:border-gray-700 transition-colors ${
              isActive 
                ? 'bg-white dark:bg-gray-900 border-b-2 border-b-blue-500' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Link
              to={tab.path as any}
              className={`flex-1 px-3 py-2 text-sm truncate ${
                isActive ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {tab.title}
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
                if (tabs.length === 1) {
                  navigate({ to: '/library' })
                }
              }}
              className="px-2 py-1 mr-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <RxCross2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
