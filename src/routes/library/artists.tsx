import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/library/artists')({
  component: LibraryArtists,
})

function LibraryArtists() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">By Artist</h1>
      <p>Per-artist grouped view placeholder.</p>
    </div>
  )
}
