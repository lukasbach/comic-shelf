import { useRouterState, useSearch } from '@tanstack/react-router'
import { RxChevronRight } from 'react-icons/rx'
import { useTabs } from '../contexts/tab-context'
import { useIndexPaths } from '../hooks/use-index-paths'
import { normalizePath } from '../utils/image-utils'
import { NavigationLink } from './navigation-link'

export function BreadcrumbBar() {
  const { location } = useRouterState()
  const { tabs, activeTabId, updateTab } = useTabs()
  const { indexPaths } = useIndexPaths()
  const search = useSearch({ strict: false }) as { path?: string }
  
  const activeTab = tabs.find(t => t.id === activeTabId)
  const path = location.pathname

  const isLibrary = path.startsWith('/library')
  const isViewer = path.startsWith('/viewer')
  const isSettings = path.startsWith('/settings')

  const segments: { label: string; to: string; search?: Record<string, any>; onClick?: () => void }[] = [
    { label: 'Library', to: '/library' }
  ]

  const getSegmentsForPath = (targetPath: string) => {
    const normTargetPath = normalizePath(targetPath)
    const root = indexPaths.find(ip => {
      const normIp = normalizePath(ip.path)
      return normTargetPath === normIp || normTargetPath.startsWith(normIp + '/')
    })

    if (!root) {
      if (normTargetPath) {
          segments.push({ label: normTargetPath, to: '/library', search: { path: normTargetPath } })
      }
      return
    }

    const normRoot = normalizePath(root.path)
    segments.push({ label: root.path, to: '/library', search: { path: normRoot } })

    if (normRoot !== normTargetPath) {
      const relative = normTargetPath.slice(normRoot.length).replace(/^\//, '')
      const pathSegments = relative.split('/')
      let currentBuild = normRoot
      
      for (const segment of pathSegments) {
        currentBuild = currentBuild.endsWith('/') ? currentBuild + segment : currentBuild + '/' + segment
        segments.push({ label: segment, to: '/library', search: { path: currentBuild } })
      }
    }
  }

  if (isLibrary) {
    if (path.endsWith('/list')) segments.push({ label: 'All Comics', to: '/library/list' })
    else if (path.endsWith('/all-pages')) segments.push({ label: 'All Pages', to: '/library/all-pages' })
    else if (path.endsWith('/artists')) segments.push({ label: 'Artists', to: '/library/artists' })
    else if (path.endsWith('/favorites')) segments.push({ label: 'Favorites', to: '/library/favorites' })
    else if (path.endsWith('/galleries')) segments.push({ label: 'Galleries', to: '/library/galleries' })
    else if (path === '/library' || path === '/library/') {
      const currentPath = search.path || ''
      if (currentPath) {
        segments.length = 0
        segments.push({ label: 'Library', to: '/library', search: { path: '' } })
        getSegmentsForPath(currentPath)
      } else {
        segments.push({ label: 'Explorer', to: '/library', search: { path: '' } })
      }
    }
  } else if (isViewer && activeTab && activeTab.type === 'comic') {
    if (activeTab.galleryId) {
      segments.push({ label: 'Galleries', to: '/library/galleries' })
      segments.push({ 
        label: activeTab.title, 
        to: `/viewer/gallery-${activeTab.galleryId}`,
        onClick: () => activeTabId && updateTab(activeTabId, { viewMode: 'overview' })
      })
    } else if (activeTab.comicPath && !activeTab.comicPath.startsWith('gallery://')) {
      segments.length = 0
      segments.push({ label: 'Library', to: '/library', search: { path: '' } })
      getSegmentsForPath(activeTab.comicPath)
      
      // Update the last path segment to be the comic title and point to the viewer
      if (segments.length > 1) {
        const lastIndex = segments.length - 1
        segments[lastIndex].label = activeTab.title
        segments[lastIndex].to = `/viewer/${activeTab.comicId}`
        segments[lastIndex].search = {}
        segments[lastIndex].onClick = () => activeTabId && updateTab(activeTabId, { viewMode: 'overview' })
      }
    } else {
      segments.push({ 
        label: activeTab.title, 
        to: `/viewer/${activeTab.comicId}`,
        onClick: () => activeTabId && updateTab(activeTabId, { viewMode: 'overview' })
      })
    }
    
    if (activeTab.currentPage !== undefined) {
      segments.push({ 
        label: `Page ${activeTab.currentPage + 1}`, 
        to: activeTab.galleryId ? `/viewer/gallery-${activeTab.galleryId}` : `/viewer/${activeTab.comicId}`,
        search: { page: activeTab.currentPage }
      })
    }
  } else if (isSettings) {
    segments.push({ label: 'Settings', to: '/settings' })
  }

  return (
    <nav className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
      {segments.map((segment, index) => (
        <div key={`${segment.label}-${index}`} className="flex items-center">
          {index > 0 && <RxChevronRight className="mx-2 text-gray-300 shrink-0" />}
          <NavigationLink
            to={segment.to as any}
            search={segment.search}
            title={segment.label}
            className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-40 ${
              index === segments.length - 1 ? 'text-gray-900 dark:text-gray-100 font-semibold' : ''
            }`}
            onClick={() => {
              if (segment.onClick) {
                segment.onClick()
              }
            }}
          >
            {segment.label}
          </NavigationLink>
        </div>
      ))}
    </nav>
  )
}
