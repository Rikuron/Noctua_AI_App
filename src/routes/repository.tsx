import { useState, useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute, useAuth } from '../components/authProvider'
import { Navigation } from '../components/navigation'
import { UploadPublicDocumentModal } from '../components/ui/UploadPublicDocumentModal'
import { PDFViewer } from '../components/pdfViewer'
import { usePDFs } from '../hooks/usePDFs'
import {
  Search,
  Filter,
  FileText,
  Download,
  Trash2,
  Plus,
  Upload,
  Calendar,
  HardDrive,
  AlertCircle,
  Eye,
  X,
  MoreVertical
} from 'lucide-react'
import { getAllUserSources, deleteSource } from '../lib/firestore/sources'
import type { Source } from '../types/source'
// import { RefreshCw } from 'lucide-react'

export const Route = createFileRoute('/repository')({
  component: MaterialRepository,
})

function MaterialRepository() {
  const { user } = useAuth()
  const { pdfs: hookPdfs, loading: hookLoading, error: hookError, refetch } = usePDFs()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [viewingPdf, setViewingPdf] = useState<Source | null>(null)

  // Renamed to firestoreSources to be explicit
  const [firestoreSources, setFirestoreSources] = useState<Source[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  // const [syncing, setSyncing] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<string | null>(null)

  // Load Firestore sources if user is authenticated
  useEffect(() => {
    async function loadSources() {
      if (user && user.uid) {
        try {
          setLoading(true)
          setError(null)
          const userSources = await getAllUserSources(user.uid)
          setFirestoreSources(userSources)
        } catch (err: any) {
          setError('Failed to load documents. Please try again.')
        } finally {
          setLoading(false)
        }
      }
    }
    loadSources()
  }, [user])

  // Merge Firestore sources with Storage PDFs
  const sources = useMemo(() => {
    const combined = [...firestoreSources]
    const existingUrls = new Set(firestoreSources.map(s => s.url))

    if (!hookLoading && hookPdfs.length > 0) {
      hookPdfs.forEach(pdf => {
        if (!existingUrls.has(pdf.url)) {
          combined.push({
            id: pdf.id,
            notebookId: 'public-repository', // Mark as public storage file
            name: pdf.name,
            url: pdf.url,
            size: pdf.size,
            uploadedAt: pdf.uploadedAt,
            extractedText: '',
            type: 'pdf'
          })
        }
      })
    }
    return combined
  }, [firestoreSources, hookPdfs, hookLoading])

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
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      setDeleting(source.id)

      // Check if this is a public repository document
      if (source.notebookId === 'public-repository' || source.notebookId === 'global-pdfs') {
        // Delete from the global pdfs collection
        const { deletePublicDocument } = await import('../lib/firestore/sources')
        await deletePublicDocument(source.id)
      } else {
        // Delete from notebook sources
        await deleteSource(source.notebookId, source.id)
      }

      const userSources = await getAllUserSources(user.uid)
      setFirestoreSources(userSources)
    } catch (err) {
      console.error('Error deleting source:', err)
      setError('Failed to delete document. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  /* const handleSync = async () => {
    if (!user) return
    try {
      setSyncing(true)
      const addedCount = await syncStorageWithFirestore()
      if (addedCount > 0) {
        const userSources = await getAllUserSources(user.uid)
        setFirestoreSources(userSources)
        alert(`Successfully synced ${addedCount} documents from storage.`)
      } else {
        alert('Storage is already in sync with repository.')
      }
    } catch (err) {
      console.error('Sync failed:', err)
      alert('Failed to sync documents. Please try again.')
    } finally {
      setSyncing(false)
    }
  } */

  const handleViewPdf = (source: Source) => {
    setViewingPdf(source)
    setMobileMenuOpen(null)
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Byte'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatDateMobile = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  // Use sources for document listing (Firestore or fallback Storage)
  const filteredSources = sources.filter(pdf =>
    pdf.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
        <Navigation currentPage="repository" />
        <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-8">
          {/* Header Section */}
          <div className="mb-4 sm:mb-8">
            <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">Material Repository</h1>
            <p className="text-gray-400 text-xs sm:text-base">
              Access and manage your uploaded PDFs (from storage only)
            </p>
          </div>
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-3 h-3 sm:w-4 sm:h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white text-sm w-full sm:w-64"
                />
              </div>
              <button className="flex items-center gap-1 px-2 py-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors sm:flex hidden">
                <Filter className="w-3 h-3" />
                <span className="hidden sm:inline text-sm">Filter</span>
              </button>
              {/* <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1 px-2 py-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                title="Sync Storage"
              >
                <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline text-sm">Sync</span>
              </button> */}
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:py-2 rounded-lg transition-colors text-sm w-full sm:w-auto"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Add Document</span>
            </button>
          </div>

          {/* Statistics - Compact for Mobile */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-4 sm:mb-8">
            <div className="bg-gray-800 p-3 sm:p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-3 h-3 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-lg font-semibold">{sources.length}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">Documents</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 p-3 sm:p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <HardDrive className="w-3 h-3 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-lg font-semibold">
                    {formatFileSize(sources.reduce((total, source) => total + source.size, 0))}
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm">Storage</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 p-3 sm:p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-3 h-3 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-lg font-semibold">{sources.filter(s => s.type === 'pdf').length}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">PDFs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {(error || hookError) && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-xs">{error || hookError}</span>
            </div>
          )}

          {/* Documents List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400 text-sm">Loading PDFs...</div>
            </div>
          ) : filteredSources.length > 0 ? (
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="px-3 sm:px-6 py-3 border-b border-gray-700 bg-gray-900">
                <h2 className="text-base sm:text-lg font-semibold">Documents ({filteredSources.length})</h2>
              </div>
              <div className="divide-y divide-gray-700">
                {filteredSources.map((source) => (
                  <div
                    key={source.id}
                    className="px-3 sm:px-6 py-3 hover:bg-gray-750 transition-colors cursor-pointer group"
                    onClick={() => setSelectedSource(source)}
                  >
                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate text-sm">{source.name}</h3>
                          <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Uploaded {formatDate(source.uploadedAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              <span>{formatFileSize(source.size)}</span>
                            </div>
                            <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs uppercase">
                              {source.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPdf(source);
                          }}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded transition-colors"
                          title="View PDF"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(source);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                          title="Download"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSource(source);
                          }}
                          disabled={deleting === source.id}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile Layout - Ultra Compact */}
                    <div className="sm:hidden">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center shrink-0">
                          <FileText className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white text-xs truncate mb-1">{source.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{formatDateMobile(source.uploadedAt)}</span>
                            <span>•</span>
                            <span>{formatFileSize(source.size)}</span>
                            <span>•</span>
                            <span className="text-blue-400 uppercase">{source.type}</span>
                          </div>
                        </div>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMobileMenuOpen(mobileMenuOpen === source.id ? null : source.id);
                            }}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                          {/* Mobile Action Menu */}
                          {mobileMenuOpen === source.id && (
                            <div className="absolute right-0 top-6 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10 min-w-28">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewPdf(source);
                                }}
                                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-white hover:bg-gray-600 transition-colors first:rounded-t-lg"
                              >
                                <Eye className="w-3 h-3" />
                                View
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(source);
                                }}
                                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-white hover:bg-gray-600 transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSource(source);
                                }}
                                disabled={deleting === source.id}
                                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-red-400 hover:bg-gray-600 transition-colors last:rounded-b-lg disabled:opacity-50"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 sm:py-16 px-4">
              <FileText className="w-8 h-8 sm:w-16 sm:h-16 text-gray-400 mb-3" />
              <h3 className="text-base font-medium text-gray-300 mb-2 text-center">
                {searchQuery ? 'No matching documents' : 'No documents yet'}
              </h3>
              <p className="text-gray-400 mb-4 text-center max-w-md text-xs sm:text-base">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Upload documents to your notebooks to see them here.'
                }
              </p>
              {!searchQuery && (
                <div className="text-center">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm w-full sm:w-auto"
                  >
                    <Upload className="w-3 h-3" />
                    Upload First Document
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* PDF Viewer Modal */}
        {viewingPdf && (
          <PDFViewer
            pdfUrl={viewingPdf.url}
            pdfName={viewingPdf.name}
            onClose={() => setViewingPdf(null)}
          />
        )}

        {/* Upload Modal */}
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

        {/* Document Details Modal - Compact for Mobile */}
        {selectedSource && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
            onClick={() => setSelectedSource(null)}
          >
            <div
              className="bg-gray-800 rounded-t-2xl sm:rounded-lg border border-gray-700 w-full sm:max-w-2xl sm:max-h-[80vh] overflow-hidden h-[80vh] sm:h-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-700 sticky top-0 bg-gray-800">
                <h2 className="text-lg sm:text-xl font-semibold">Document Details</h2>
                <button
                  onClick={() => setSelectedSource(null)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto h-full pb-16 sm:pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-medium break-words">{selectedSource.name}</h3>
                    <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm mt-1 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-blue-600/20 text-blue-400 rounded text-xs uppercase">
                        {selectedSource.type}
                      </span>
                      <span>{formatFileSize(selectedSource.size)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 py-3 sm:py-4 border-t border-gray-700">
                  <div>
                    <label className="text-xs sm:text-sm text-gray-400 block mb-1">Upload Date</label>
                    <p className="text-white text-xs sm:text-base">{formatDate(selectedSource.uploadedAt)}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm text-gray-400 block mb-1">File Type</label>
                    <p className="text-white text-xs sm:text-base">{selectedSource.type.toUpperCase()}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm text-gray-400 block mb-1">File Size</label>
                    <p className="text-white text-xs sm:text-base">{formatFileSize(selectedSource.size)}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm text-gray-400 block mb-1">Notebook</label>
                    <p className="text-white text-xs sm:text-base truncate">{selectedSource.notebookId}</p>
                  </div>
                </div>

                {selectedSource.extractedText && (
                  <div className="border-t border-gray-700 pt-3 sm:pt-4">
                    <label className="text-xs sm:text-sm text-gray-400 block mb-2">Extracted Content</label>
                    <div className="bg-gray-900 rounded-lg p-3 max-h-32 sm:max-h-40 overflow-y-auto">
                      <p className="text-gray-300 text-xs sm:text-sm whitespace-pre-wrap">
                        {selectedSource.extractedText.substring(0, 300)}
                        {selectedSource.extractedText.length > 300 && '...'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-700 sticky bottom-0 bg-gray-800 pb-3 sm:pb-0 -mx-3 sm:mx-0 px-3 sm:px-0">
                  <button
                    onClick={() => handleDownload(selectedSource)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors flex-1 text-sm"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteSource(selectedSource)
                      setSelectedSource(null)
                    }}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors flex-1 text-sm"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
