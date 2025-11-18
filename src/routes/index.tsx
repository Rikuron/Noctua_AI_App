import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ProtectedRoute, useAuth } from '../components/authProvider'
import { Navigation } from '../components/navigation'
import { Plus, Search, Filter, AlertCircle, Loader2, BookOpen } from 'lucide-react'
import { useNotebooks } from '../hooks/useNotebooks'
import { NotebookCard } from '../components/cards/NotebookCard'
import { AppLoader } from '../components/ui/AppLoader'

export const Route = createFileRoute('/')({
  component: NotebooksHomepage,
})

function NotebooksHomepage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { notebooks, sourceCounts, loading, error, deleteNotebook, refetch } = useNotebooks(user?.uid)
  
  const [creating, setCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      navigate({ to: '/notebook/$notebookId', params: { notebookId } })
    } catch (error: any) {
      console.error('Failed to create notebook:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteNotebook = async (notebookId: string) => {
    if (!user) return
    
    setDeletingId(notebookId)
    
    try {
      await deleteNotebook(notebookId)
    } catch (error: any) {
      console.error('Failed to delete notebook:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleUpdateNotebookDetails = async (
    notebookId: string,
    updates: { icon?: string; name: string; description: string }
  ) => {
    try {
      const { updateNotebook } = await import('../lib/firestore/notebook')
      await updateNotebook(notebookId, updates)
      await refetch()
    } catch (error: any) {
      console.error('Failed to update notebook:', error)
      throw error
    }
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
      <div className="min-h-screen bg-linear-to-br from-gray-900 to-gray-950 text-white">
        <Navigation currentPage="notebooks" />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 pb-20 lg:pb-8">
          {/* Welcome Section */}
          <div className="mb-6 lg:mb-12">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="lg:flex-1">
                <h1 className="text-lg sm:text-3xl lg:text-4xl font-bold bg-linear-to-br from-white to-gray-300 bg-clip-text text-transparent mb-2">
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
                  className="flex hover:cursor-pointer items-center justify-center gap-2 bg-linear-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 font-medium"
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
                        className="hover:cursor-pointer bg-gray-800/50 border border-gray-700 rounded-xl pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none w-40"
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
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-400 mb-1 text-sm">Database Error</h4>
                    <p className="text-xs text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notebooks Grid */}
          {loading ? <AppLoader size="md" label="Loading your workspaces..." /> : filteredAndSortedNotebooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredAndSortedNotebooks.map((notebook) => (
                <NotebookCard
                  key={notebook.id}
                  notebook={notebook}
                  sourceCount={sourceCounts[notebook.id] || 0}
                  isDeleting={deletingId === notebook.id}
                  onDelete={() => handleDeleteNotebook(notebook.id)}
                  onUpdate={(updates) => handleUpdateNotebookDetails(notebook.id, updates)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 lg:py-24">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50 mb-4">
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
                  className="inline-flex items-center gap-2 bg-linear-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 font-medium text-sm"
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
        <div className="lg:hidden fixed bottom-8 left-4 right-4 z-40">
          <div className="flex justify-center">
            <button
              onClick={createNewNotebook}
              disabled={creating}
              className="flex items-center justify-center gap-2 bg-linear-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg active:scale-95 font-medium text-sm w-auto max-w-[140px] shadow-xl"
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