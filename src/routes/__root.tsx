import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { SettingsProvider } from '../contexts/settings-context'
import { TabProvider } from '../contexts/tab-context'
import { IndexingProvider } from '../contexts/indexing-context'
import { ViewerRefProvider } from '../contexts/viewer-ref-context'
import { TopBar } from '../components/top-bar'
import { TabBar } from '../components/tab-bar'
import { useAppHotkeys } from '../hooks/use-app-hotkeys'
import { ErrorBoundary } from '../components/error-boundary'
import { ToastProvider } from '../components/toast'
import { useEffect } from 'react'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayoutContent() {
  useAppHotkeys();
  const routerState = useRouterState();

  useEffect(() => {
    const isViewer = routerState.location.pathname.startsWith('/viewer/');
    if (isViewer) {
      // Title will be updated by the viewer component if it has the title
      // But we can set a default here
      document.title = 'Comic Shelf';
    } else {
      document.title = 'Comic Shelf';
    }
  }, [routerState.location.pathname]);
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <TopBar />
      <TabBar />
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
}

function RootLayout() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ToastProvider>
          <TabProvider>
            <IndexingProvider>
              <ViewerRefProvider>
                <RootLayoutContent />
              </ViewerRefProvider>
            </IndexingProvider>
          </TabProvider>
        </ToastProvider>
      </SettingsProvider>
    </ErrorBoundary>
  )
}
