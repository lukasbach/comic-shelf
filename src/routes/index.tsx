import { createFileRoute } from '@tanstack/react-router'
import { useSettings } from '../contexts/settings-context'
import { useState, useEffect } from 'react'
import { getAllIndexPaths, addIndexPath } from '../services/index-path-service'
import type { IndexPath } from '../types/comic'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const { settings, updateSettings, isLoading } = useSettings()
  const [paths, setPaths] = useState<IndexPath[]>([])
  const [dbStatus, setDbStatus] = useState<string>('Initializing...')

  useEffect(() => {
    refreshPaths()
  }, [])

  const refreshPaths = async () => {
    try {
      const allPaths = await getAllIndexPaths()
      setPaths(allPaths)
      setDbStatus('Connected')
    } catch (e) {
      setDbStatus(`Error: ${e}`)
    }
  }

  const handleAddPath = async () => {
    try {
      await addIndexPath('C:/Comics/Test', '{artist}/{series}')
      await refreshPaths()
    } catch (e) {
      alert(`Failed to add path: ${e}`)
    }
  }

  if (isLoading) return <div>Loading Settings...</div>

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold underline">Comic Viewer Debug</h1>
      
      <section className="p-4 border border-gray-500 rounded">
        <h2 className="text-xl font-bold">Settings Test</h2>
        <div className="mt-2">
          <p>Current Theme: <span className="font-mono">{settings.theme}</span></p>
          <button 
            className="px-4 py-2 mt-2 bg-blue-600 text-white rounded cursor-pointer"
            onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
          >
            Toggle Theme
          </button>
        </div>
      </section>

      <section className="p-4 border border-gray-500 rounded">
        <h2 className="text-xl font-bold">Database Test</h2>
        <p className="mt-2">DB Status: <span className="font-mono">{dbStatus}</span></p>
        <button 
          className="px-4 py-2 mt-2 bg-green-600 text-white rounded cursor-pointer"
          onClick={handleAddPath}
        >
          Add Test Index Path
        </button>
        <div className="mt-4">
          <h3 className="font-bold">Index Paths in DB:</h3>
          <ul className="list-disc pl-5">
            {paths.map(p => (
              <li key={p.id}>{p.path} (Pattern: {p.pattern})</li>
            ))}
            {paths.length === 0 && <li>No paths found. Tap "Add" above.</li>}
          </ul>
        </div>
      </section>
    </div>
  )
}
