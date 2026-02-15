import { createRootRoute, Outlet } from '@tanstack/react-router'
import { SettingsProvider } from '../contexts/settings-context'
import { TabProvider } from '../contexts/tab-context'
import { IndexingProvider } from '../contexts/indexing-context'
import { ViewerRefProvider } from '../contexts/viewer-ref-context'
import { TopBar } from '../components/top-bar'
import { TabBar } from '../components/tab-bar'
import { useAppHotkeys } from '../hooks/use-app-hotkeys'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayoutContent() {
  useAppHotkeys();
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
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
    <SettingsProvider>
      <TabProvider>
        <IndexingProvider>
          <ViewerRefProvider>
            <RootLayoutContent />
          </ViewerRefProvider>
        </IndexingProvider>
      </TabProvider>
    </SettingsProvider>
  )
}
