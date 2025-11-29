import { FileText, Download, Trash2 } from "lucide-react"
import { formatFileSize, formatDate } from "../../formatters"
import type { Source } from "../../types/source"
import { Modal } from "./Modal"
import { useAuth } from "../authProvider"

interface DocumentDetailsModalProps {
  source: Source | null
  onClose: () => void
  onDownload: (source: Source) => void
  onDelete: (source: Source) => void
}

export function DocumentDetailsModal({ source, onClose, onDownload, onDelete }: DocumentDetailsModalProps) {
  const { user } = useAuth()
  
  if (!source) return null

  const isPublic = source.notebookId === 'public-repository'
  const canDelete = !isPublic || (user && source.uploaderId === user.uid)
  
  return (
    <Modal
      isOpen={!!source}
      onClose={onClose}
      title="Document Details"
      size="md"
    >
      <div className="space-y-4">
        {/* Header Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-medium wrap-break-word">{source.name}</h3>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-700">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Upload Date</label>
            <p className="text-sm text-white">{formatDate(source.uploadedAt)}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">File Type</label>
            <p className="text-sm text-white">{source.type.toUpperCase()}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">File Size</label>
            <p className="text-sm text-white">{formatFileSize(source.size)}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Notebook</label>
            <p className="text-sm text-white wrap-break-word">{source.notebookId}</p>
          </div>
          {isPublic && (
            <div>
              <label className="text-sm text-gray-400 block mb-1">Uploaded By</label>
              <p className="text-sm text-white wrap-break-word">{source.uploadedBy}</p>
            </div>
          )}
        </div>

        {/* Extracted Text */}
        {source.extractedText && (
          <div className="border-t border-gray-700 pt-4">
            <label className="text-sm text-gray-400 block mb-2">Extracted Content</label>
            <div className="bg-gray-900 rounded-lg p-3 max-h-40 overflow-y-auto custom-scrollbar">
              <p className="text-gray-300 text-sm whitespace-pre-wrap">
                {source.extractedText.substring(0, 300)}
                {source.extractedText.length > 300 && '...'}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <button
            onClick={() => onDownload(source)}
            className="flex items-center justify-center gap-2 bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          {canDelete && (
            <button
              onClick={() => {
                onDelete(source)
                onClose()
              }}
              className="flex items-center justify-center gap-2 bg-red-600 cursor-pointer hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}