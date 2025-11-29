import { useState } from 'react'
import { Plus, MessageCircle, FileUp, Globe } from 'lucide-react'
import { WorkspaceSourceCard } from '../cards/WorkspaceSourceCard'
import { MaterialRepositoryModal } from '../modals/MaterialRepositoryModal'
import { AppLoader } from '../ui/AppLoader'

interface SourcesSidebarProps {
  activeTab: 'chat' | 'sources' | 'studio'
  chatbotSources: any[]
  globalPdfs: any[]
  pdfsLoading: boolean
  pdfsError: string | null
  activeSourceIds: string[]
  sourceFilter: 'all' | 'uploaded' | 'repository'
  notebookId: string
  onShowUploadModal: () => void
  onToggleSource: (sourceId: string) => void
  onDeleteSource: (sourceId: string) => void
  onAddGlobalPdfToWorkspace: (pdf: any) => void
  onRefetchSources: () => void
  setSourceFilter: (filter: 'all' | 'uploaded' | 'repository') => void
}

export function SourcesSidebar({
  activeTab,
  chatbotSources,
  globalPdfs,
  pdfsLoading,
  pdfsError,
  activeSourceIds,
  sourceFilter,
  onShowUploadModal,
  onToggleSource,
  onDeleteSource,
  onAddGlobalPdfToWorkspace,
  setSourceFilter
}: SourcesSidebarProps) {
  const [showMaterialModal, setShowMaterialModal] = useState(false)

  // Filter chatbot sources based on active filter
  const filteredChatbotSources = chatbotSources.filter(source => {
    if (sourceFilter === 'all') return true
    if (sourceFilter === 'uploaded') return !source.fromRepository
    if (sourceFilter === 'repository') return source.fromRepository
    return true
  })

  return (
    <>
      <div className={`${activeTab === 'sources' ? 'flex' : 'hidden'
        } lg:flex w-full lg:w-80 border-r border-gray-700 flex-col bg-gray-900 min-h-0`}>
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">📁 Sources</h2>
            <button
              onClick={onShowUploadModal}
              className="w-fit flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 hover:cursor-pointer transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Upload sources
            </button>
          </div>

          {/* Active Sources Status */}
          <div className="flex items-center justify-between mt-4 px-2">
            <span className="text-sm text-gray-400">Active for chat</span>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
              {activeSourceIds.length} / {chatbotSources.length}
            </span>
          </div>

          {/* Source Filter - Mobile & Desktop */}
          <div className="flex gap-1 p-1 bg-gray-800 rounded-lg mt-4">
            {(['all', 'uploaded', 'repository'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSourceFilter(filter)}
                className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${sourceFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:cursor-pointer'
                  }`}
              >
                {filter === 'all' ? 'All' : filter === 'uploaded' ? 'Uploaded' : 'Repo'}
              </button>
            ))}
          </div>
        </div>

        {/* Sources List */}
        <div className="flex-1 overflow-y-auto min-h-0 pb-6">
          {/* Chatbot Sources */}
          {pdfsLoading ? (
            <div className="flex h-full items-center justify-center">
              <AppLoader size="sm" label="Loading sources..." />
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  {sourceFilter === 'repository' ? (
                    <>
                      <Globe className="w-4 h-4 text-green-400" />
                      <span>Material Repository Sources</span>
                    </>
                  ) : sourceFilter === 'uploaded' ? (
                    <>
                      <FileUp className="w-4 h-4 text-blue-400" />
                      <span>Uploaded Sources</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 text-blue-400" />
                      <span>Workspace Sources</span>
                    </>
                  )}
                  <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                    {filteredChatbotSources.length}
                  </span>
                </h3>
              </div>

              {filteredChatbotSources.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-4">
                  No sources added yet
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredChatbotSources.map(source => (
                    <WorkspaceSourceCard
                      key={source.id}
                      source={source}
                      isActive={activeSourceIds.includes(source.id)}
                      onToggle={() => onToggleSource(source.id)}
                      onDelete={() => onDeleteSource(source.id)}
                    />
                  ))}
                </div>
              )}

              {/* Add from Repository Button */}
              <button
                onClick={() => setShowMaterialModal(true)}
                className="w-fit flex items-center gap-2 px-3 py-2 my-5 mx-auto bg-green-900/20 border border-green-700 rounded-lg hover:cursor-pointer hover:bg-green-900/40 transition-colors text-sm"
              >
                <Globe className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Add from Material Repository</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Material Repository Modal */}
      <MaterialRepositoryModal
        isOpen={showMaterialModal}
        onClose={() => setShowMaterialModal(false)}
        globalPdfs={globalPdfs}
        pdfsLoading={pdfsLoading}
        pdfsError={pdfsError}
        onAddPdfToWorkspace={(pdf) => {
          onAddGlobalPdfToWorkspace(pdf)
          setShowMaterialModal(false)
        }}
      />
    </>
  )
}