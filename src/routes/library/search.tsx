import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/library/search')({
  component: LibrarySearch,
})

function LibrarySearch() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Search Results</h1>
      <p>Search results placeholder.</p>
    </div>
  )
}
