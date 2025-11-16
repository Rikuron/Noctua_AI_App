import React, { useState } from 'react'
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { CustomScrollbarStyles } from './CustomScrollbar'
import { addSource } from '../lib/firestore/sources'
import type { SourceInput } from '../types/source'

interface UploadSourcesModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (sources: any[]) => void
  notebookId?: string
}

export function UploadSourcesModal({ isOpen, onClose, onUpload, notebookId }: UploadSourcesModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: 'pending' | 'uploading' | 'success' | 'error'}>({})
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')
    setSelectedFiles(files)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files).filter(f => f.type === 'application/pdf') : []
    setSelectedFiles(files)
  }

  const handleUpload = async () => {
    if (!notebookId) {
      setError('Notebook ID is required to upload sources')
      return
    }

    if (selectedFiles.length === 0) {
      setError('Please select at least one file to upload')
      return
    }

    setUploading(true)
    setError(null)

    const progress: {[key: string]: 'pending' | 'uploading' | 'success' | 'error'} = {}
    selectedFiles.forEach(file => {
      progress[file.name] = 'pending'
    })
    setUploadProgress(progress)

    const uploadedSources: any[] = []

    for (const file of selectedFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 'uploading' }))

        const sourceInput: SourceInput = {
          name: file.name,
          file: file,
          type: 'pdf'
        }

        const sourceId = await addSource(notebookId, sourceInput)
        uploadedSources.push({ id: sourceId, name: file.name })
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 'success' }))
      } catch (error: any) {
        console.error('Error uploading file: ', file.name, error)
        setUploadProgress(prev => ({ ...prev, [file.name]: 'error' }))
        setError(`Failed to upload ${file.name}: ${error.message || 'Unknown error'}`)
      }
    }

    setUploading(false)

    // If at least one file succeeded, call onUpload with the list of uploaded sources
    if (uploadedSources.length > 0) {
      setTimeout(() => {
        onUpload(uploadedSources)
        onClose()
      }, 1000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <CustomScrollbarStyles />
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl border border-gray-600 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold">📄</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Noctua Ai</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            disabled={uploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Add sources</h3>
            {!notebookId && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                <p className="text-sm text-yellow-400"> ⚠️ No notebook selected. Please close and try again </p>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-400 mb-6">
            Upload PDF documents to use as reference sources in this notebook.<br/>
            The AI will extract text and use it to answer your questions.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium mb-2">Upload sources</h3>
            <p className="text-sm text-gray-400 mb-4">
              Drag & drop or{' '}
              <label className="text-blue-400 underline hover:text-blue-300 cursor-pointer">
                choose file
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.md,.mp3,.docx,.avif,.bmp,.gif,.ico,.jp2,.png,.webp,.tif,.tiff,.heic,.heif,.jpeg,.jpg,.jpe"
                />
              </label>{' '}to upload
            </p>
            <p className="text-xs text-gray-500">
              Supported file types: PDF only (for now)
            </p>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">Selected files ({selectedFiles.length}):</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-blue-400">📄</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{file.name}</p>
                          <p className="text-xs text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      {uploadProgress[file.name] === 'uploading' && (
                        <div className="text-blue-400 text-xs">Uploading...</div>
                      )}
                      {uploadProgress[file.name] === 'success' && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      {uploadProgress[file.name] === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            {selectedFiles.length > 0 && (
              <button
                onClick={handleUpload}
                disabled={uploading || !notebookId}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}