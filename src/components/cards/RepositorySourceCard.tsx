import { FileText, Eye, Download, Trash2, File, FileCode, FileType } from "lucide-react"
import type { Source } from "../../types/source"
import { formatFileSize, formatDate } from "../../utils/formatters"

interface RepositorySourceCardProps {
  source: Source
  activeTab: 'user-sources' | 'public-sources'
  deleting: string | null
  onSelect: (source: Source) => void
  onView: (source: Source) => void
  onDownload: (source: Source) => void
  onDelete: (source: Source) => void
}

const getFileIcon = (type: String) => {
  switch (type) {
    case 'pdf':
      return <FileText className="w-5 h-5" />
    case 'docx':
      return <File className="w-5 h-5" />
    case 'md':
    case 'txt':
      return <FileCode className="w-5 h-5" />
    default:
      return <FileType className="w-5 h-5" />
  }
}

const getIconColor = (type: String) => {
  switch (type) {
    case 'pdf':
      return 'text-red-400 bg-red-600/20 border-2 border-red-600'
    case 'docx':
      return 'text-blue-400 bg-blue-600/20 border-2 border-blue-600'
    case 'md':
    case 'txt':
      return 'text-blue-400 bg-blue-600/20 border-2 border-blue-600'
    default:
      return 'text-blue-400 bg-blue-600/20 border-2 border-blue-600'
  }
}

export function RepositorySourceCard({
  source,
  activeTab,
  deleting,
  onSelect,
  onView,
  onDownload,
  onDelete
}: RepositorySourceCardProps) {
  return (
    <div
      className="bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-200 group cursor-pointer flex flex-col overflow-hidden"
      onClick={() => onSelect(source)}
    >
      {/* Card Header / Icon */}
      <div className="p-4 bg-gray-800/50 border-b border-gray-700/50 flex items-start justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getIconColor(source.type)}`}>
            {getFileIcon(source.type)}
          </div>
          <h3 className="font-medium text-white text-sm wrap-normal" title={source.name}>
            {source.name}
          </h3>
        </div>
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onView(source)
            }}
            disabled={source.type === 'docx'} 
            className={`p-1.5 rounded transition-colors ${
              source.type !== 'docx'
                ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700 cursor-pointer' 
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title={source.type !== 'docx' ? "View" : "Viewing not supported for this file type"}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDownload(source)
            }}
            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 cursor-pointer rounded"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Only show delete for My Uploads */}
          {activeTab === 'user-sources' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(source)
              }}
              disabled={deleting === source.id}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 cursor-pointer rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Size</span>
            <span className="text-gray-300">{formatFileSize(source.size)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Type</span>
            <span className="uppercase bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">
              {source.type}
            </span>
          </div>

          {activeTab === 'public-sources' && source.uploadedBy && (
            <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-700/50">
              <span>Uploaded By</span>
              <span className="text-gray-300 truncate max-w-[120px]" title={source.uploadedBy}>
                {source.uploadedBy}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Uploaded</span>
            <span>{formatDate(source.uploadedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}