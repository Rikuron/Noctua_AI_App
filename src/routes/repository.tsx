import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute, useAuth } from '../components/authProvider'
import { Navigation } from '../components/navigation'
import { UploadPublicDocumentModal } from '../components/modals/UploadPublicDocumentModal'
import { PDFViewer } from '../components/PDFViewer'
import { AppLoader } from '../components/ui/AppLoader'
import { AlertCircle, LayoutGrid } from 'lucide-react'
import { useRepositorySources } from '../hooks/useRepositorySources'
import { deleteSource } from '../lib/firestore/sources'
import type { Source } from '../types/source'
import { RepositorySourceCard } from '../components/cards/RepositorySourceCard'
import { RepositoryActionsBar } from '../components/sections/RepositoryActionsBar'
import { Statistics } from '../components/sections/Statistics'
import { DocumentDetailsModal } from '../components/modals/DocumentDetailsModal'
import { MarkdownViewer } from '../components/MarkdownViewer'

export const Route = createFileRoute('/repository')({
  component: MaterialRepository,
})

function MaterialRepository() {
  const { user } = useAuth()
  const { sources, loading, error, refetch } = useRepositorySources(user)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [viewingPdf, setViewingPdf] = useState<Source | null>(null)
  const [viewingMarkdown, setViewingMarkdown] = useState<Source | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'user-sources' | 'public-sources'>('user-sources')
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'docx' | 'txt' | 'md'>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleDownload = async (source: Source) => {
    try {
      const response = await fetch(source.url)
      if (!response.ok) throw new Error('Network response was not ok')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = source.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback: try to open in new tab
      window.open(source.url, '_blank')
    }
  }

  const handleDeleteSource = async (source: Source) => {
    if (!user) return
    
    const isPublic = source.notebookId === 'public-repository'
    const message = isPublic
      ? 'This will remove this document from the public database. This action cannot be undone. Are you sure?'
      : 'Are you sure you want to delete this document?'

    if (!confirm(message)) return

    try {
      setDeleting(source.id)

      // Check if this is a public repository document
      if (source.notebookId === 'public-repository') {
        // Delete from the global pdfs collection
        const { deletePublicDocument } = await import('../lib/firestore/sources')
        await deletePublicDocument(source.id)
      } else {
        // Delete from notebook sources
        await deleteSource(source.notebookId, source.id)
      }

      refetch()
    } catch (err) {
      console.error('Error deleting source:', err)
    } finally {
      setDeleting(null)
    }
  }

  const handleViewSource = (source: Source) => {
    if (source.type === 'pdf') setViewingPdf(source)
    else if (source.type === 'md' || source.type === 'txt') setViewingMarkdown(source)
  }

  // Filter sources by active tab
  const tabSources = sources.filter(source => {
    const isPublic = source.notebookId === 'public-repository'
    return activeTab === 'public-sources' ? isPublic : !isPublic
  })

  // Use sources for document listing (Firestore or fallback Storage)
  const filteredSources = tabSources
    .filter(source => {
      const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = filterType === 'all' || source.type === filterType
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      const dateA = new Date(a.uploadedAt).getTime()
      const dateB = new Date(b.uploadedAt).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
        <Navigation currentPage="repository" />
        <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-4 sm:py-8">
          {/* Header Section */}
          <div className="mb-4 sm:mb-8">
            <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">Material Repository</h1>
            <p className="text-gray-400 text-xs sm:text-base">
              Access and manage the source materials you've uploaded as well as those available publicly.
            </p>
          </div>

          {/* Actions Bar */}
          <RepositoryActionsBar 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterType={filterType}
            setFilterType={setFilterType}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            onUpload={() => setShowUploadModal(true)}
          />

          {/* Tab Navigation */}
          <div className="flex items-center gap-4 mb-6 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('user-sources')}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'user-sources'
                  ? 'text-blue-400'
                  : 'text-gray-400 hover:text-gray-300 cursor-pointer'
                } duration-200 ease-in-out`}
            >
              User's Sources
              {activeTab === 'user-sources' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('public-sources')}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'public-sources'
                  ? 'text-blue-400'
                  : 'text-gray-400 hover:text-gray-300 cursor-pointer'
                } duration-200 ease-in-out`}
            >
              Public Sources
              {activeTab === 'public-sources' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-t-full" />
              )}
            </button>
          </div>

          {/* Statistics - Compact for Mobile */}
          <Statistics sources={tabSources} />

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
              <span className="text-red-400 text-xs">{error}</span>
            </div>
          )}

          {/* Documents List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <AppLoader />
            </div>
          ) : filteredSources.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSources.map((source) => (
                <RepositorySourceCard
                  key={source.id}
                  source={source}
                  activeTab={activeTab}
                  deleting={deleting}
                  onSelect={() => setSelectedSource(source)}
                  onView={handleViewSource}
                  onDownload={handleDownload}
                  onDelete={handleDeleteSource}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-800/50 rounded-xl border border-gray-700 border-dashed">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <LayoutGrid className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                {searchQuery ? 'No matching documents' : `No ${activeTab === 'user-sources' ? 'uploads' : 'public documents'} found`}
              </h3>
              <p className="text-gray-500 text-sm max-w-sm text-center">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : activeTab === 'user-sources'
                    ? 'Upload documents to your notebooks to see them here.'
                    : 'No public documents are available at the moment.'}
              </p>
            </div>
          )}
        </main>

        {/* PDF Viewer Modal | Called if pressed View button of PDF Source */}
        {viewingPdf && (
          <PDFViewer
            pdfUrl={viewingPdf.url}
            pdfName={viewingPdf.name}
            onClose={() => setViewingPdf(null)}
          />
        )}

        {/* Markdown Viewer Modal | Called if pressed View button of Markdown or Text Source */}
        {viewingMarkdown && (
          <MarkdownViewer
            url={viewingMarkdown.url}
            name={viewingMarkdown.name}
            onClose={() => setViewingMarkdown(null)}
          />
        )}

        {/* Upload Modal | Called if showUploadModal (Add Document button is pressed) is true */}
        {showUploadModal && (
          <UploadPublicDocumentModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onUpload={() => {
              setShowUploadModal(false)
              refetch()
            }}
          />
        )}

        {/* Document Details Modal - Compact for Mobile | Called if a source (RepositorySourceCard) is selected */}
        <DocumentDetailsModal
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
          onDownload={handleDownload}
          onDelete={handleDeleteSource}
        />
      </div>
    </ProtectedRoute>
  )
}
