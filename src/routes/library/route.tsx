import { createFileRoute, Outlet } from '@tanstack/react-router'
import { LibrarySidebar } from '../../components/library-sidebar'

export const Route = createFileRoute('/library')({
  component: LibraryLayout,
})

function LibraryLayout() {
  return (
    <div className="flex h-full w-full overflow-hidden">
      <LibrarySidebar />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
