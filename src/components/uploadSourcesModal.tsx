import React, { useState } from 'react'
import { X, Upload } from 'lucide-react'

interface UploadSourcesModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (sources: any[]) => void
}

export function UploadSourcesModal({ isOpen, onClose, onUpload }: UploadSourcesModalProps) {
  const [dragActive, setDragActive] = useState(false)

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
    
    const files = Array.from(e.dataTransfer.files)
    console.log('Dropped files:', files)
    // TODO: Handle file upload
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl border border-gray-600 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold">📄</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">NotebookLM</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Add sources</h3>
            <button className="text-blue-400 text-sm hover:text-blue-300 transition-colors">
              🔍 Discover sources
            </button>
          </div>
          
          <p className="text-sm text-gray-400 mb-6">
            Sources let NotebookLM base its responses on the information that matters most to you.<br/>
            (Examples: marketing plans, course reading, research notes, meeting transcripts, sales documents, etc.)
          </p>

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
              Drag & drop or <button className="text-blue-400 underline hover:text-blue-300">choose file</button> to upload
            </p>
            <p className="text-xs text-gray-500">
              Supported file types: PDF, .txt, Markdown, Audio (e.g. mp3), .docx, .avif, .bmp, .gif, .ico, .jp2, .png, .webp, .tif, .tiff, .heic, .heif, .jpeg, .jpg, .jpe
            </p>
          </div>

          {/* Source Options */}
          <div className="grid grid-cols-3 gap-3">
            <SourceOption
              icon="🌐"
              title="Google Workspace"
              onClick={() => console.log('Google Workspace clicked')}
            />
            <SourceOption
              icon="🔗"
              title="Link"
              onClick={() => console.log('Link clicked')}
            />
            <SourceOption
              icon="📝"
              title="Paste text"
              onClick={() => console.log('Paste text clicked')}
            />
            <SourceOption
              icon="💾"
              title="Google Drive"
              onClick={() => console.log('Google Drive clicked')}
            />
            <SourceOption
              icon="🌐"
              title="Website"
              onClick={() => console.log('Website clicked')}
            />
            <SourceOption
              icon="🎥"
              title="YouTube"
              onClick={() => console.log('YouTube clicked')}
            />
            <SourceOption
              icon="📋"
              title="Copied text"
              onClick={() => console.log('Copied text clicked')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function SourceOption({ 
  icon, 
  title, 
  onClick 
}: { 
  icon: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-center border border-gray-600 hover:border-gray-500"
    >
      <div className="text-xl">
        {icon}
      </div>
      <span className="text-sm">{title}</span>
    </button>
  )
}