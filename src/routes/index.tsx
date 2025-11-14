import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ProtectedRoute, useAuth } from '../components/authProvider'
import { getUserNotebooks } from '../lib/firestore/notebook'
import type { Notebook } from '../types/notebook'
import { Plus, BookOpen, Clock, User } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: NotebooksHomepage,
})

function NotebooksHomepage() {
  const { user, signOut } = useAuth()
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    if (user) {
      loadNotebooks()
    }
  }, [user])

  const loadNotebooks = async () => {
    try {
      setLoading(true)
      if (user) {
        const userNotebooks = await getUserNotebooks(user.uid)
        setNotebooks(userNotebooks)
      }
    } catch (error) {
      console.error('Failed to load notebooks:', error)
    } finally {
      setLoading(false)
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
        {/* Header */}
        <header className="border-b border-gray-800 bg-[#0f0f0f]">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo512.png" alt="Noctua AI" className="w-8 h-8" />
                <h1 className="text-xl font-semibold">Noctua AI</h1>
              </div>
              
              <div className="flex items-center gap-4">
                <Link 
                  to="/test" 
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  API Test
                </Link>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <User className="w-4 h-4" />
                  {user?.email}
                </div>
                <button
                  onClick={signOut}
                  className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">
              Welcome back{user?.displayName ? `, ${user.displayName}` : ''}
            </h2>
            <p className="text-gray-400">
              Create and organize your study materials with AI-powered insights
            </p>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-semibold">Your Notebooks</h3>
              <span className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                {notebooks.length} {notebooks.length === 1 ? 'notebook' : 'notebooks'}
              </span>
            </div>
            
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Notebook
            </button>
          </div>

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
                      <span>0 sources</span>
                      <span>0 chats</span>
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
              <h3 className="text-xl font-semibold mb-2">No notebooks yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first notebook to start organizing your study materials
              </p>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Your First Notebook
              </button>
            </div>
          )}
        </main>

        {/* Create Notebook Dialog */}
        {showCreateDialog && (
          <CreateNotebookDialog
            onClose={() => setShowCreateDialog(false)}
            onSuccess={() => {
              setShowCreateDialog(false)
              loadNotebooks()
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}

function CreateNotebookDialog({ onClose, onSuccess }: { 
  onClose: () => void
  onSuccess: () => void 
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { createNotebook } = await import('../lib/firestore/notebook')
      const notebookId = await createNotebook(user.uid, {
        name: name.trim(),
        description: description.trim()
      })
      onClose()
      navigate({ to: '/notebook/$notebookId', params: { notebookId } })
    } catch (err: any) {
      setError(err.message || 'Failed to create notebook')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Create New Notebook</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Notebook Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Physics Study Notes"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              maxLength={100}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you study in this notebook?"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              maxLength={500}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-400 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Notebook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NotebooksHomepage