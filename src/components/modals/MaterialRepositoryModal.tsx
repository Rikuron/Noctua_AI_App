import { useState } from 'react'
import { X, Search, Globe, Filter, ArrowUpDown } from 'lucide-react'
import { MaterialCard } from '../cards/MaterialCard'
import { ErrorMessage } from '../ui/ErrorMessage'
import { AppLoader } from '../ui/AppLoader'
import { Modal } from './Modal'
import { PDFViewer } from '../PDFViewer'
import { MarkdownViewer } from '../MarkdownViewer'

interface MaterialRepositoryModalProps {
  isOpen: boolean
  onClose: () => void
  sources: any[]
  loading: boolean
  error: string | null
  onAddSourceToWorkspace: (source: any) => void
}

export function MaterialRepositoryModal({
  isOpen,
  onClose,
  sources,
  loading,
  error,
  onAddSourceToWorkspace
}: MaterialRepositoryModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'docx' | 'md' | 'txt'>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewingSource, setViewingSource] = useState<any | null>(null)

  // Filter sources based on search
  const filteredSources = sources
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

  if (!isOpen) return null

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Material Repository"
        subtitle={`${filteredSources.length} ${filteredSources.length === 1 ? 'material' : 'materials'} available`}
        icon={<Globe className="w-5 h-5 text-green-400" />}
        iconWrapperClassName="w-10 h-10 bg-green-900/20 rounded-lg flex items-center justify-center"
        size="lg" 
        className="[&>div:last-child]:p-0! [&>div:last-child]:overflow-hidden!"
      >
        <div className="flex flex-col h-[70vh] p-6">
          {/* Controls Section */}
          <div className="pb-4 flex flex-col sm:flex-row gap-3 shrink-0">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-11 pr-10 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex gap-2 shrink-0">
              <div className="relative flex-1 sm:w-40 sm:flex-none">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full pl-9 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500 text-white text-sm appearance-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                  <option value="txt">TXT</option>
                  <option value="md">Markdown</option>
                </select>
              </div>

              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors text-sm text-white whitespace-nowrap"
              >
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
                <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <AppLoader size="sm" label="Loading materials..." />
              </div>
            ) : error ? (
              <div className="py-4">
                <ErrorMessage message={error} />
              </div>
            ) : filteredSources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Globe className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-gray-400">
                  {searchQuery ? 'No materials found' : 'No materials in repository'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-sm text-green-400 hover:text-green-300"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredSources.map(source => (
                  <MaterialCard
                    key={source.id}
                    source={source}
                    onAddToWorkspace={() => onAddSourceToWorkspace(source)}
                    onView={() => setViewingSource(source)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Viewers */}
      {viewingSource && viewingSource.type === 'pdf' && (
        <PDFViewer
          pdfUrl={viewingSource.url}
          pdfName={viewingSource.name}
          onClose={() => setViewingSource(null)}
        />
      )}

      {viewingSource && (viewingSource.type === 'md' || viewingSource.type === 'txt') && (
        <MarkdownViewer
          url={viewingSource.url}
          name={viewingSource.name}
          onClose={() => setViewingSource(null)}
        />
      )}
    </>
  )
}