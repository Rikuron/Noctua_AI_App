import { useState } from 'react'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { X } from 'lucide-react'
import { AppLoader } from './ui/AppLoader'

interface PDFViewerProps {
  pdfUrl: string
  pdfName: string
  onClose: () => void
}

export function PDFViewer({ pdfUrl, pdfName, onClose }: PDFViewerProps) {
  const [loading, setLoading] = useState(true)
  useLockBodyScroll()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl h-[85vh] bg-gray-900 rounded-xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800/50">
          <h3 className="text-lg font-semibold text-white truncate pr-4">{pdfName}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 cursor-pointer hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PDF Content */}
        <div className="flex-1">
          {loading && (
            <div className="pt-8">
              <AppLoader label="Loading PDF..." />
            </div>
          )}
          <iframe
            src={pdfUrl}
            className="w-full h-full"
            onLoad={() => setLoading(false)}
            title={pdfName}
          />
        </div>
      </div>
    </div>
  )
}
