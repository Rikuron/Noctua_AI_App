import { useState } from 'react'
import { X, Search, Globe } from 'lucide-react'
import { MaterialCard } from '../cards/MaterialCard'
import { ErrorMessage } from '../ui/ErrorMessage'
import { AppLoader } from '../ui/AppLoader'
import { Modal } from './Modal'

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

  // Filter sources based on search
  const filteredSources = sources.filter(source =>
    source.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Material Repository"
      subtitle={`${filteredSources.length} ${filteredSources.length === 1 ? 'material' : 'materials'} available`}
      icon={<Globe className="w-5 h-5 text-green-400" />}
      iconWrapperClassName="w-10 h-10 bg-green-900/20 rounded-lg flex items-center justify-center"
      size="md"
    >
      <div className="flex flex-col h-[60vh]">
        {/* Search Bar */}
        <div className="pb-4">
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

        {/* List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
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
                  className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSources.map(source => (
                <MaterialCard
                  key={source.id}
                  source={source}
                  onAddToWorkspace={() => onAddSourceToWorkspace(source)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}