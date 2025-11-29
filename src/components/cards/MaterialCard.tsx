import { Plus, FileText } from 'lucide-react'
import { formatFileSize, formatDate } from '../../formatters'

interface MaterialCardProps {
  source: {
    id: string
    name: string
    size: number
    uploadedAt: Date
  }
  onAddToWorkspace: () => void
}

export function MaterialCard({ source, onAddToWorkspace }: MaterialCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-600 hover:border-gray-500 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-sm truncate">{source.name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{formatFileSize(source.size)}</span>
            <span>•</span>
            <span>{formatDate(source.uploadedAt)}</span>
          </div>
        </div>
        <button
          onClick={onAddToWorkspace}
          className="ml-2 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>
    </div>
  )
}