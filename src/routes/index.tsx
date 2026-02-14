import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => <div className="text-3xl font-bold underline">Comic Viewer</div>,
})
