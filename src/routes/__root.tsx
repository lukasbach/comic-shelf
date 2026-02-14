import { createRootRoute, Outlet } from '@tanstack/react-router'
import { SettingsProvider } from '../contexts/settings-context'
import { TabProvider } from '../contexts/tab-context'
import { IndexingProvider } from '../contexts/indexing-context'
import { TopBar } from '../components/top-bar'
import { TabBar } from '../components/tab-bar'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <SettingsProvider>
      <TabProvider>
        <IndexingProvider>
          <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
            <TopBar />
            <TabBar />
            <main className="flex-1 overflow-hidden relative">
              <Outlet />
            </main>
          </div>
        </IndexingProvider>
      </TabProvider>
    </SettingsProvider>
  )
}
