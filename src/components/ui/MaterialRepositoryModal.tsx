import { useState } from 'react'
import { X, Search, Globe } from 'lucide-react'
import { MaterialCard } from '../cards/MaterialCard'
import { ErrorMessage } from '../ui/ErrorMessage'
import { AppLoader } from './AppLoader'

interface MaterialRepositoryModalProps {
  isOpen: boolean
  onClose: () => void
  globalPdfs: any[]
  pdfsLoading: boolean
  pdfsError: string | null
  onAddPdfToWorkspace: (pdf: any) => void
}

export function MaterialRepositoryModal({
  isOpen,
  onClose,
  globalPdfs,
  pdfsLoading,
  pdfsError,
  onAddPdfToWorkspace
}: MaterialRepositoryModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter PDFs based on search
  const filteredPdfs = globalPdfs.filter(pdf =>
    pdf.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-900/20 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Material Repository</h2>
              <p className="text-sm text-gray-400">
                {filteredPdfs.length} {filteredPdfs.length === 1 ? 'material' : 'materials'} available
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-11 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500"
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
        </div>

        {/* PDFs List */}
        <div className="flex-1 overflow-y-auto p-6">
          {pdfsLoading ? (
            <div className="flex items-center justify-center py-12">
              <AppLoader size="sm" label="Loading materials..." />
            </div>
          ) : pdfsError ? (
            <div className="py-4">
              <ErrorMessage message={pdfsError} />
            </div>
          ) : filteredPdfs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Globe className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400">
                {searchQuery ? 'No materials found' : 'No materials in repository'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPdfs.map(pdf => (
                <MaterialCard
                  key={pdf.id}
                  pdf={pdf}
                  onAddToWorkspace={() => onAddPdfToWorkspace(pdf)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}