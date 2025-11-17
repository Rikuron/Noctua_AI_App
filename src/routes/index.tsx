import { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ProtectedRoute, useAuth } from '../components/authProvider'
import { Navigation } from '../components/navigation'
import { getUserNotebooks, deleteNotebook } from '../lib/firestore/notebook'
import { getNotebookSources } from '../lib/firestore/sources'
import type { Notebook } from '../types/notebook'
import { Plus, BookOpen, Clock, FileText, Search, Filter, AlertCircle, Loader2, Trash2, MoreVertical } from 'lucide-react'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null)

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

  const handleDeleteNotebook = async (notebookId: string) => {
    if (!user) return
    
    setDeletingId(notebookId)
    setShowDeleteMenu(null)
    
    try {
      await deleteNotebook(notebookId)
      
      // Remove from local state
      setNotebooks(prev => prev.filter(notebook => notebook.id !== notebookId))
      
      // Remove from source counts
      setSourceCounts(prev => {
        const newCounts = { ...prev }
        delete newCounts[notebookId]
        return newCounts
      })
      
    } catch (error: any) {
      console.error('Failed to delete notebook:', error)
      setError('Failed to delete notebook. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return formatDate(date)
  }

  // Filter and sort notebooks
  const filteredAndSortedNotebooks = notebooks
    .filter(notebook => 
      notebook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notebook.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      } else {
        return a.name.localeCompare(b.name)
      }
    })

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white">
        <Navigation currentPage="notebooks" />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 pb-20 lg:pb-8">
          {/* Welcome Section */}
          <div className="mb-6 lg:mb-12">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="lg:flex-1">
                <h1 className="text-lg sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                  Welcome back{user?.displayName ? `, ${user.displayName}` : ''}
                </h1>
                <p className="text-gray-400 text-xs sm:text-base">
                  Create and organize your study materials with AI-powered insights
                </p>
              </div>
              
              {/* New Workspace Button - Hidden on mobile (will show in sticky footer) */}
              <div className="hidden lg:flex lg:justify-end">
                <button
                  onClick={createNewNotebook}
                  disabled={creating}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 font-medium"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {creating ? 'Creating...' : 'New Workspace'}
                </button>
              </div>
            </div>
          </div>

          {/* Stats and Controls Section */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Your Workspaces</h2>
                <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full border border-gray-700">
                  {notebooks.length} {notebooks.length === 1 ? 'workspace' : 'workspaces'}
                </span>
              </div>
              
              {/* Search and Filter - BUTTONS for mobile, dropdown for desktop */}
              <div className="w-full lg:w-auto">
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  {/* Search Bar */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search workspaces..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  {/* Mobile: Buttons | Desktop: Dropdown */}
                  <div className="flex gap-2">
                    {/* Mobile Buttons - visible on small screens */}
                    <div className="flex gap-2 sm:hidden">
                      <button
                        onClick={() => setSortBy('date')}
                        className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm border transition-all ${
                          sortBy === 'date' 
                            ? 'bg-blue-600 border-blue-500 text-white' 
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50'
                        }`}
                      >
                        <Filter className="w-3 h-3" />
                        Date
                      </button>
                      <button
                        onClick={() => setSortBy('name')}
                        className={`px-3 py-2 rounded-xl text-sm border transition-all ${
                          sortBy === 'name' 
                            ? 'bg-blue-600 border-blue-500 text-white' 
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50'
                        }`}
                      >
                        Name
                      </button>
                    </div>
                    
                    {/* Desktop Dropdown - hidden on mobile */}
                    <div className="hidden sm:block relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
                        className="bg-gray-800/50 border border-gray-700 rounded-xl pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none w-40"
                      >
                        <option value="date">Sort by date</option>
                        <option value="name">Sort by name</option>
                      </select>
                      <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-400 mb-1 text-sm">Database Error</h4>
                    <p className="text-xs text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notebooks Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12 lg:py-24">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-400 text-xs">Loading your workspaces...</p>
              </div>
            </div>
          ) : filteredAndSortedNotebooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredAndSortedNotebooks.map((notebook) => (
                <div key={notebook.id} className="group relative">
                  {/* Delete Menu Overlay */}
                  {showDeleteMenu === notebook.id && (
                    <div className="absolute top-2 right-2 z-10 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2">
                      <button
                        onClick={() => handleDeleteNotebook(notebook.id)}
                        disabled={deletingId === notebook.id}
                        className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-md transition-colors w-full text-sm disabled:opacity-50"
                      >
                        {deletingId === notebook.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        {deletingId === notebook.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}

                  {/* Notebook Card */}
                  <Link
                    to="/notebook/$notebookId"
                    params={{ notebookId: notebook.id }}
                    className="block"
                  >
                    <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:border-gray-600/70 transition-all duration-300 hover:shadow-lg hover:transform hover:scale-[1.02] group-hover:bg-gray-800/40 h-full">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg border border-blue-500/20">
                          <BookOpen className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded border border-gray-700/50">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{getRelativeTime(notebook.updatedAt)}</span>
                          </div>
                          {/* More Options Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setShowDeleteMenu(showDeleteMenu === notebook.id ? null : notebook.id)
                            }}
                            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <h4 className="font-semibold mb-1 group-hover:text-blue-400 transition-colors line-clamp-2 text-sm leading-tight">
                        {notebook.name}
                      </h4>
                      
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                        {notebook.description || 'No description provided'}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-400 bg-gray-800/50 px-2 py-1 rounded border border-gray-700/50">
                          <FileText className="w-3 h-3" />
                          <span>{sourceCounts[notebook.id] || 0} docs</span>
                        </div>
                        <span className="text-blue-400 font-medium text-xs bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                          Workspace
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 lg:py-24">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50 mb-4">
                <BookOpen className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No matching workspaces' : 
                 error ? 'Database Configuration Needed' : 'No workspaces yet'}
              </h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto text-xs leading-relaxed">
                {searchQuery 
                  ? `No workspaces found matching "${searchQuery}". Try adjusting your search.`
                  : error 
                  ? 'Configure Firestore security rules to start using notebooks'
                  : 'Create your first workspace to upload and organize documents with AI-powered insights'
                }
              </p>
              {!error && !searchQuery && (
                <button
                  onClick={createNewNotebook}
                  disabled={creating}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 font-medium text-sm"
                >
                  {creating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  {creating ? 'Creating...' : 'Create Your First Workspace'}
                </button>
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </main>

        {/* Sticky New Workspace Button for Mobile */}
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
          <div className="flex justify-center">
            <button
              onClick={createNewNotebook}
              disabled={creating}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg active:scale-95 font-medium text-sm w-auto max-w-[140px] shadow-lg"
            >
              {creating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
              {creating ? 'Creating...' : 'New'}
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default NotebooksHomepage