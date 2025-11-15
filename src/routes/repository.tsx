import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute, useAuth } from '../components/authProvider'
import { Navigation } from '../components/navigation'
import { UploadSourcesModal } from '../components/uploadSourcesModal'
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
  Eye
} from 'lucide-react'
import { getAllUserSources, deleteSource } from '../lib/firestore/sources'
import type { Source } from '../types/source'

export const Route = createFileRoute('/repository')({
  component: MaterialRepository,
})

function MaterialRepository() {
  const { user } = useAuth()
  const { pdfs: hookPdfs, loading: hookLoading } = usePDFs()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [viewingPdf, setViewingPdf] = useState<Source | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    if (user) {
      loadSources()
    }
  }, [user])

  // Also try the usePDFs hook as a fallback
  useEffect(() => {
    if (!hookLoading && hookPdfs.length > 0 && sources.length === 0) {
      console.log('Using PDFs from usePDFs hook as fallback:', hookPdfs)
      // Convert hookPdfs to Source format
      const convertedSources: Source[] = hookPdfs.map(pdf => ({
        id: pdf.id,
        notebookId: 'hook-collection',
        name: pdf.name,
        url: pdf.url,
        size: pdf.size,
        uploadedAt: pdf.uploadedAt,
        extractedText: '',
        type: 'pdf' as const
      }))
      setSources(convertedSources)
      setLoading(false)
    }
  }, [hookPdfs, hookLoading, sources.length])

  const loadSources = async () => {
    try {
      setLoading(true)
      setError(null)
      if (user) {
        console.log('Loading sources for user:', user.uid)
        const userSources = await getAllUserSources(user.uid)
        console.log('Found sources:', userSources.length)
        setSources(userSources.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()))
      }
    } catch (error: any) {
      console.error('Failed to load sources:', error)
      if (error.code === 'permission-denied') {
        setError('Access denied. Please make sure you are signed in and have proper permissions.')
      } else {
        setError('Failed to load documents. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSource = async (source: Source) => {
    if (!confirm(`Are you sure you want to delete "${source.name}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(source.id)
    try {
      await deleteSource(source.notebookId, source.id)
      await loadSources() // Reload sources after deletion
    } catch (error) {
      console.error('Error deleting source:', error)
      alert('Failed to delete document')
    } finally {
      setDeleting(null)
    }
  }

  const handleDownload = (source: Source) => {
    const link = document.createElement('a')
    link.href = source.url
    link.download = source.name
    document.body.appendChild(link)
    // Try to force download
    link.click()
    document.body.removeChild(link)
    // Fallback: if browser opens in new tab, let user know
    setTimeout(() => {
      // If the file is not downloaded, open in new tab
      // (No reliable way to detect, but this helps for remote files)
      window.open(source.url, '_blank')
    }, 500)
  }

  const handleViewPdf = (source: Source) => {
    setViewingPdf(source)
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

  const filteredSources = sources.filter(source =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
        <Navigation currentPage="repository" />

        <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Material Repository</h1>
            <p className="text-gray-400">Access and manage your uploaded documents and study materials</p>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white w-80"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
            
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Document
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{sources.length}</h3>
                  <p className="text-gray-400 text-sm">Total Documents</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {formatFileSize(sources.reduce((total, source) => total + source.size, 0))}
                  </h3>
                  <p className="text-gray-400 text-sm">Total Storage Used</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{sources.filter(s => s.type === 'pdf').length}</h3>
                  <p className="text-gray-400 text-sm">PDF Documents</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          {/* Documents List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading documents...</div>
            </div>
          ) : filteredSources.length > 0 ? (
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700 bg-gray-900">
                <h2 className="text-lg font-semibold">Documents ({filteredSources.length})</h2>
              </div>
              <div className="divide-y divide-gray-700">
                {filteredSources.map((source) => (
                  <div
                    key={source.id}
                    className="px-6 py-4 hover:bg-gray-750 transition-colors cursor-pointer"
                    onClick={() => setSelectedSource(source)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{source.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Uploaded {formatDate(source.uploadedAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              <span>{formatFileSize(source.size)}</span>
                            </div>
                            <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded-md text-xs uppercase">
                              {source.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewPdf(source)
                          }}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded-lg transition-colors"
                          title="View PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(source)
                          }}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {source.notebookId && source.notebookId !== 'hook-collection' && source.notebookId !== 'global-pdfs' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSource(source)
                            }}
                            disabled={deleting === source.id}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            className="p-2 text-gray-700 bg-gray-900 rounded-lg cursor-not-allowed opacity-50"
                            title="Cannot delete global or fallback document"
                            disabled
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                {searchQuery ? 'No matching documents' : 'No documents yet'}
              </h3>
              <p className="text-gray-400 mb-6 text-center max-w-md">
                {searchQuery 
                  ? 'Try adjusting your search terms or filters'
                  : 'Upload documents to your notebooks to see them here. Documents from all your notebooks will appear in this repository.'
                }
              </p>
              {!searchQuery && (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-4">
                    💡 Tip: Create a notebook and upload PDFs to get started
                  </p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Your First Document
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
          <UploadSourcesModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onUpload={() => {
              setShowUploadModal(false)
              loadSources()
            }}
          />
        )}

        {/* Document Details Modal */}
        {selectedSource && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold">Document Details</h2>
                <button
                  onClick={() => setSelectedSource(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{selectedSource.name}</h3>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs uppercase">
                        {selectedSource.type}
                      </span>
                      <span>{formatFileSize(selectedSource.size)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-700">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Upload Date</label>
                    <p className="text-white">{formatDate(selectedSource.uploadedAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">File Type</label>
                    <p className="text-white">{selectedSource.type.toUpperCase()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">File Size</label>
                    <p className="text-white">{formatFileSize(selectedSource.size)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Notebook</label>
                    <p className="text-white">{selectedSource.notebookId}</p>
                  </div>
                </div>

                {selectedSource.extractedText && (
                  <div className="border-t border-gray-700 pt-4">
                    <label className="text-sm text-gray-400 block mb-2">Extracted Content</label>
                    <div className="bg-gray-900 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">
                        {selectedSource.extractedText.substring(0, 500)}
                        {selectedSource.extractedText.length > 500 && '...'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => handleDownload(selectedSource)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteSource(selectedSource)
                      setSelectedSource(null)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
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