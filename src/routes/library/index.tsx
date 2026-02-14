import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/library/')({
  component: LibraryExplorer,
})

function LibraryExplorer() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Library Explorer</h1>
      <p>File explorer view placeholder.</p>
    </div>
  )
}
