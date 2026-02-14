import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/library/list')({
  component: LibraryList,
})

function LibraryList() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">All Comics</h1>
      <p>Flat list view placeholder.</p>
    </div>
  )
}
