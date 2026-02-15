import { Link } from '@tanstack/react-router'
import { BreadcrumbBar } from './breadcrumb-bar'
import { RxGear, RxMinus, RxBox, RxCross2, RxCopy } from 'react-icons/rx'
import { LuGithub } from 'react-icons/lu'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useEffect, useState } from 'react'

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
    <header className="h-12 relative flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 z-20 select-none">
      <div
        data-tauri-drag-region
        className="absolute inset-0"
        onDoubleClick={() => appWindow.toggleMaximize()}
      />
      <div className="flex items-center gap-4 relative pointer-events-none">
        <div className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mr-4">
          ComicShelf
        </div>
        <div className="pointer-events-auto">
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

        <Link
          to="/settings"
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors mr-2 cursor-pointer"
          title="Settings"
        >
          <RxGear className="w-5 h-5" />
        </Link>

        <div className="flex items-center">
          <button
            onClick={() => appWindow.minimize()}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors cursor-pointer"
            title="Minimize"
          >
            <RxMinus className="w-4 h-4" />
          </button>
          <button
            onClick={() => appWindow.toggleMaximize()}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors cursor-pointer"
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
            className="p-2 text-gray-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:text-gray-400 transition-colors cursor-pointer"
            title="Close"
          >
            <RxCross2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
