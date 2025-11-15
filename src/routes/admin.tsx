import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../components/authProvider'
import { Navigation } from '../components/navigation'
import { getUserNotebooks, deleteNotebook } from '../lib/firestore/notebook'
import { getNotebookSources } from '../lib/firestore/sources'
import type { Notebook } from '../types/notebook'
import type { Source } from '../types/source'
import { Trash2, FileText, AlertTriangle } from 'lucide-react'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

function AdminPage() {
  const { user } = useAuth()
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [sources, setSources] = useState<Record<string, Source[]>>({})
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Load all notebooks
      const userNotebooks = await getUserNotebooks(user.uid)
      setNotebooks(userNotebooks)

      // Load sources for each notebook
      const sourcesData: Record<string, Source[]> = {}
      for (const notebook of userNotebooks) {
        try {
          const notebookSources = await getNotebookSources(notebook.id)
          sourcesData[notebook.id] = notebookSources
        } catch (error) {
          console.error(`Error loading sources for notebook ${notebook.id}:`, error)
          sourcesData[notebook.id] = []
        }
      }
      setSources(sourcesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNotebook = async (notebookId: string) => {
    if (!confirm('Are you sure you want to delete this notebook? This action cannot be undone.')) {
      return
    }

    setDeleting(notebookId)
    try {
      await deleteNotebook(notebookId)
      await loadData() // Reload data
    } catch (error) {
      console.error('Error deleting notebook:', error)
      alert('Failed to delete notebook')
    } finally {
      setDeleting(null)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div>Please sign in to access admin panel</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div>Loading database contents...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Navigation currentPage="admin" />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Database Admin Panel</h1>
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Use with caution - deletions cost Firebase operations</span>
          </div>
        </div>

        <div className="mb-6 bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Database Summary</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">{notebooks.length}</div>
              <div className="text-sm text-gray-400">Total Notebooks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {Object.values(sources).reduce((total, notebookSources) => total + notebookSources.length, 0)}
              </div>
              <div className="text-sm text-gray-400">Total PDFs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">
                {(
                  Object.values(sources).reduce((total, notebookSources) => 
                    total + notebookSources.reduce((size, source) => size + (source.size || 0), 0), 0
                  ) / (1024 * 1024)
                ).toFixed(1)} MB
              </div>
              <div className="text-sm text-gray-400">Total Storage</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {notebooks.map((notebook) => {
            const notebookSources = sources[notebook.id] || []
            return (
              <div key={notebook.id} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{notebook.name}</h3>
                    <p className="text-sm text-gray-400">{notebook.description || 'No description'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {notebook.createdAt.toLocaleDateString()} • 
                      ID: {notebook.id}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteNotebook(notebook.id)}
                    disabled={deleting === notebook.id}
                    className="text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="border-t border-gray-700 pt-3">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    PDFs in this notebook ({notebookSources.length})
                  </h4>
                  {notebookSources.length > 0 ? (
                    <div className="space-y-2">
                      {notebookSources.map((source) => (
                        <div key={source.id} className="bg-gray-700 p-2 rounded text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{source.name}</span>
                            <span className="text-gray-400">
                              {((source.size || 0) / (1024 * 1024)).toFixed(1)} MB
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Uploaded: {source.uploadedAt instanceof Date ? source.uploadedAt.toLocaleDateString() : 'Unknown'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No PDFs uploaded yet</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {notebooks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400">No notebooks found in database</div>
          </div>
        )}
      </div>
    </div>
  )
}