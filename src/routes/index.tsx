import { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ProtectedRoute, useAuth } from '../components/authProvider'
import { Navigation } from '../components/navigation'
import { getUserNotebooks } from '../lib/firestore/notebook'
import { getNotebookSources } from '../lib/firestore/sources'
import type { Notebook } from '../types/notebook'
import { Plus, BookOpen, Clock, FileText } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: NotebooksHomepage,
})

function NotebooksHomepage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [sourceCounts, setSourceCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (user) {
      loadNotebooks()
    }
  }, [user])

  const loadNotebooks = async () => {
    try {
      setLoading(true)
      setError(null)
      if (user) {
        const userNotebooks = await getUserNotebooks(user.uid)
        
        // Filter out any "Untitled notebook" entries to save costs
        const filteredNotebooks = userNotebooks.filter(notebook => 
          notebook.name !== 'Untitled notebook' || notebook.description !== ''
        )
        setNotebooks(filteredNotebooks)
        
        // Delete untitled notebooks that have no description to save costs
        const untitledNotebooks = userNotebooks.filter(notebook => 
          notebook.name === 'Untitled notebook' && notebook.description === ''
        )
        
        if (untitledNotebooks.length > 0) {
          console.log(`Cleaning up ${untitledNotebooks.length} empty untitled notebooks to save costs...`)
          for (const notebook of untitledNotebooks) {
            try {
              const { deleteNotebook } = await import('../lib/firestore/notebook')
              await deleteNotebook(notebook.id)
              console.log(`Deleted empty notebook: ${notebook.id}`)
            } catch (err) {
              console.error(`Failed to delete notebook ${notebook.id}:`, err)
            }
          }
        }
        
        // Load source counts for remaining notebooks
        const counts: Record<string, number> = {}
        for (const notebook of filteredNotebooks) {
          try {
            const sources = await getNotebookSources(notebook.id)
            counts[notebook.id] = sources.length
          } catch (error) {
            console.error(`Error loading sources for notebook ${notebook.id}:`, error)
            counts[notebook.id] = 0
          }
        }
        setSourceCounts(counts)
      }
    } catch (error: any) {
      console.error('Failed to load notebooks:', error)
      if (error.code === 'permission-denied') {
        setError('Unable to access notebooks. Please configure Firestore security rules.')
      } else {
        setError('Failed to load notebooks. Please try again.')
      }
      setNotebooks([])
    } finally {
      setLoading(false)
    }
  }

  const createNewNotebook = async () => {
    if (!user || creating) return
    
    setCreating(true)
    try {
      const { createNotebook } = await import('../lib/firestore/notebook')
      const notebookId = await createNotebook(user.uid, {
        name: 'New Workspace',
        description: 'Your document workspace'
      })
      
      console.log('Created notebook with ID:', notebookId)
      
      // Wait a moment for Firebase to fully commit the write
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      navigate({ to: '/notebook/$notebookId', params: { notebookId } })
    } catch (error: any) {
      console.error('Failed to create notebook:', error)
      setError('Failed to create notebook. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        <Navigation currentPage="notebooks" />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">
              Welcome back{user?.displayName ? `, ${user.displayName}` : ``}
            </h2>
            <p className="text-gray-400">
              Create and organize your study materials with AI-powered insights
            </p>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-semibold">Your Workspaces</h3>
              <span className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                {notebooks.length} {notebooks.length === 1 ? 'workspace' : 'workspaces'}
              </span>
            </div>
            
            <button
              onClick={createNewNotebook}
              disabled={creating}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {creating ? 'Creating...' : 'New Notebook'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-red-400 mt-0.5">⚠️</div>
                <div>
                  <h4 className="font-medium text-red-400 mb-1">Database Error</h4>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notebooks Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notebooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {notebooks.map((notebook) => (
                <Link
                  key={notebook.id}
                  to="/notebook/$notebookId"
                  params={{ notebookId: notebook.id }}
                  className="group block"
                >
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg hover:transform hover:scale-[1.02]">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 bg-blue-600/10 rounded-lg">
                        <BookOpen className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatDate(notebook.updatedAt)}
                      </div>
                    </div>
                    
                    <h4 className="font-semibold mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                      {notebook.name}
                    </h4>
                    
                    <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                      {notebook.description || 'No description'}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{sourceCounts[notebook.id] || 0} documents</span>
                      </div>
                      <span className="text-gray-600">Workspace</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {error ? 'Database Configuration Needed' : 'No workspaces yet'}
              </h3>
              <p className="text-gray-400 mb-6">
                {error 
                  ? 'Configure Firestore security rules to start using notebooks'
                  : 'Create your first workspace to upload and organize documents with AI'
                }
              </p>
              {!error && (
                <button
                  onClick={createNewNotebook}
                  disabled={creating}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {creating ? 'Creating...' : 'Create Your First Workspace'}
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}

export default NotebooksHomepage