import { useState } from 'react'

interface PDFViewerProps {
  pdfUrl: string
  pdfName: string
  onClose: () => void
}

export function PDFViewer({ pdfUrl, pdfName, onClose }: PDFViewerProps) {
  const [loading, setLoading] = useState(true)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white truncate">{pdfName}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* PDF Content */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
