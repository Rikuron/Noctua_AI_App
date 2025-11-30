import { Plus, FileText, Eye, HardDrive, Calendar, User } from 'lucide-react'
import { formatFileSize, formatDate } from '../../formatters'

interface MaterialCardProps {
  source: {
    id: string
    name: string
    size: number
    uploadedAt: Date
    type: string
    uploadedBy: string
  }
  onAddToWorkspace: () => void
  onView: () => void
}

export function MaterialCard({ source, onAddToWorkspace, onView }: MaterialCardProps) {
  const canView = source.type !== 'docx'

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1 pb-4">
              <div className="p-2 bg-green-700/15 rounded-lg shrink-0">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm text-gray-200 wrap-break-word" title={source.name}>
                  {source.name}
                </h3>
                <span className="inline-flex items-center px-1.5 py-0.5 mt-1 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                  {source.type}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                onClick={onAddToWorkspace}
                className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors shadow-lg shadow-green-900/20"
                title="Add to Workspace"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={canView ? onView : undefined}
                disabled={!canView}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                  canView 
                    ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white cursor-pointer' 
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
                }`}
                title={canView ? "View Document" : "Viewing not available for DOCX"}
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-[auto_1fr] gap-y-2 gap-x-4 text-xs text-gray-400 pt-3 border-t border-gray-700/50">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3 h-3" />
              <span>{formatFileSize(source.size)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(source.uploadedAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <User className="w-3 h-3" />
              <span className="truncate">
                by <span className="text-gray-300">{source.uploadedBy}</span>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}