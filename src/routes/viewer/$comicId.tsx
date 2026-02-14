import { createFileRoute } from '@tanstack/react-router';

type ComicViewerSearch = {
  page?: number;
};

export const Route = createFileRoute('/viewer/$comicId')({
  validateSearch: (search: Record<string, unknown>): ComicViewerSearch => {
    return {
      page: search.page ? Number(search.page) : undefined,
    };
  },
  component: ComicViewer,
});

function ComicViewer() {
  const { comicId } = Route.useParams();
  const { page } = Route.useSearch();
  
  return (
    <div className="flex h-full w-full items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Comic Viewer</h1>
        <p>Viewing comic ID: {comicId}</p>
        {page && <p>Starting at page: {page}</p>}
        <p className="text-gray-400 mt-2">Viewer modes (overview/single/scroll) placeholder.</p>
      </div>
    </div>
  );
}
