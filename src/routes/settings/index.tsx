import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings/')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">General</h2>
          <p className="text-gray-600 dark:text-gray-400">Settings configuration placeholder.</p>
        </section>
      </div>
    </div>
  )
}
