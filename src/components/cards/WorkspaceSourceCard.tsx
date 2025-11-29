import { Check, Download, X } from 'lucide-react'
import { formatFileSize, formatDate } from '../../formatters'

interface WorkspaceSourceCardProps {
  source: {
    id: string
    name: string
    size: number
    uploadedAt: Date
    url: string
    fromRepository?: boolean
  }
  isActive: boolean
  onToggle: () => void
  onDelete: () => void
}

export function WorkspaceSourceCard({ source, isActive, onToggle, onDelete }: WorkspaceSourceCardProps) {
  return (
    <div className={`bg-gray-800 rounded-lg p-3 border transition-all duration-200 ${
      isActive 
        ? 'border-blue-500 bg-blue-500/10' 
        : 'border-gray-600 hover:border-gray-500'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Toggle Button instead of checkbox */}
          <button
            onClick={onToggle}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all mt-0.5 shrink-0 ${
              isActive
                ? 'bg-blue-500 border-blue-500'
                : 'bg-gray-700 border-gray-500 hover:border-gray-400'
            }`}
          >
            {isActive && <Check className="w-2.5 h-2.5 text-white" />}
          </button>
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
          <a 
            href={source.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 hover:cursor-pointer rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => {
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