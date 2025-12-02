import { Download, Eye, X } from 'lucide-react'
import { formatFileSize, formatDate } from '../../utils/formatters'

interface WorkspaceSourceCardProps {
  source: {
    id: string
    name: string
    size: number
    uploadedAt: Date
    url: string
    fromRepository?: boolean
    type?: string
  }
  onSelect: () => void
  onView: () => void
  onDelete: () => void
}

export function WorkspaceSourceCard({ source, onSelect, onView, onDelete }: WorkspaceSourceCardProps) {
  const isRepo = source.fromRepository
  const canView = source.type !== 'docx'

  const borderColor = isRepo ? 'border-green-500/50 hover:border-green-500' : 'border-blue-500/50 hover:border-blue-500'
  const bgColor = isRepo ? 'bg-green-500/5' : 'bg-blue-500/5'

  return (
    <div 
      onClick={onSelect}
      className={`rounded-lg p-3 border cursor-pointer transition-all duration-200 ${borderColor} ${bgColor}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{source.name}</span>
              {source.fromRepository && (
                <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full border border-green-500/30">
                  Repository
                </span>
              )}
            </div>
            <div className="flex flex-col items-baseline text-sm md:text-xs text-gray-400">
              <span>Size: {formatFileSize(source.size)}</span>
              <span>Uploaded: {formatDate(source.uploadedAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onView()
            }}
            disabled={!canView}
            className={`p-1 rounded transition-colors ${
              canView 
                ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700 cursor-pointer' 
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title={canView ? "View Document" : "Viewing not available for DOCX"}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <a 
            href={source.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 hover:cursor-pointer rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation()
              const confirmed = window.confirm(
                'Remove this source from Workspace Sources? This will delete the PDF from the notebook.'
              )
              if (!confirmed) return
              onDelete()
            }}
            className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:cursor-pointer rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}