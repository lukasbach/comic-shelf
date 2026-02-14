import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/library/favorites')({
  component: LibraryFavorites,
})

function LibraryFavorites() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Favorites</h1>
      <p>Favorite comics and images placeholder.</p>
    </div>
  )
}
