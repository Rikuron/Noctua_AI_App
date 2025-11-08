import { useState } from 'react'
import { usePDFs } from '../hooks/usePDFs'
import { PDFViewer } from './pdfViewer'
import { PDFUpload } from './pdfUpload'

export function PDFLibrary() {
  const { pdfs, loading, error, refetch } = usePDFs()
  const [selectedPDF, setSelectedPDF] = useState<{ url: string; name: string } | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleUploadSuccess = () => {
    setShowUpload(false)
    refetch()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">PDF Library</h2>
        <button
          onClick={() => setShowUpload(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Upload PDF
        </button>
      </div>

      {showUpload && (
        <div className="mb-6">
          <PDFUpload onUploadSuccess={handleUploadSuccess} />
        </div>
      )}

      {pdfs.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">No PDFs uploaded yet</h3>
          <p className="text-gray-400 mb-4">Upload your first PDF to get started</p>
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
          >
            Upload PDF
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pdfs.map((pdf) => (
            <div
              key={pdf.id}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => setSelectedPDF({ url: pdf.url, name: pdf.name })}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{pdf.name}</h3>
                  <p className="text-sm text-gray-400">
                    {formatFileSize(pdf.size)} • {pdf.uploadedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPDF && (
        <PDFViewer
          pdfUrl={selectedPDF.url}
          pdfName={selectedPDF.name}
          onClose={() => setSelectedPDF(null)}
        />
      )}
    </div>
  )
}
