import { BreadcrumbBar } from './breadcrumb-bar'
import { RxGear, RxMinus, RxBox, RxCross2, RxCopy } from 'react-icons/rx'
import { LuGithub } from 'react-icons/lu'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useEffect, useState } from 'react'
import { NavigationLink } from './navigation-link'

export function TopBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const appWindow = getCurrentWindow()

  useEffect(() => {
    const updateMaximized = async () => {
      setIsMaximized(await appWindow.isMaximized())
    }

    updateMaximized()

    const unlisten = appWindow.onResized(() => {
      updateMaximized()
    })

    return () => {
      unlisten.then((fn) => fn())
    }
  }, [appWindow])

  return (
    <header className="h-12 relative flex items-center justify-between pl-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 z-20 select-none">
      <div
        data-tauri-drag-region
        className="absolute inset-0"
        onDoubleClick={() => appWindow.toggleMaximize()}
      />
      <div className="flex items-center gap-4 relative pointer-events-none">
        <NavigationLink
          to="/library"
          search={{ path: '' }}
          title="Explorer"
          className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mr-4 pointer-events-auto cursor-pointer"
        >
          Comic Shelf
        </NavigationLink>
        <div className="pointer-events-auto hidden lg:block">
          <BreadcrumbBar />
        </div>
      </div>

      <div className="flex items-center gap-1 relative">
        <button
          onClick={() => openUrl('https://github.com/lukasbach/comic-shelf')}
          className="flex items-center gap-2 px-3 py-1.5 mr-1 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          title="Star on GitHub"
        >
          <span>Star on GitHub</span>
          <LuGithub className="w-4 h-4" />
        </button>

        <NavigationLink
          to="/settings"
          title="Settings"
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors mr-2 cursor-pointer"
        >
          <RxGear className="w-5 h-5" />
        </NavigationLink>

        <div className="flex items-stretch h-12">
          <button
            onClick={() => appWindow.minimize()}
            className="w-12 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors cursor-pointer"
            title="Minimize"
          >
            <RxMinus className="w-4 h-4" />
          </button>
          <button
            onClick={() => appWindow.toggleMaximize()}
            className="w-12 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors cursor-pointer"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <RxCopy className="w-4 h-4" />
            ) : (
              <RxBox className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => appWindow.close()}
            className="w-12 flex items-center justify-center text-gray-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:text-gray-400 transition-colors cursor-pointer"
            title="Close"
          >
            <RxCross2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
