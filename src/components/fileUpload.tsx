import React, { useState, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import { FileService } from '../lib/fileService'
import type { UploadedFile } from '../lib/fileService'

interface FileUploadProps {
  onUploadComplete?: (file: UploadedFile) => void
  onUploadError?: (error: string) => void
}

export function FileUpload({ onUploadComplete, onUploadError }: FileUploadProps) {
  const { user } = useUser()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return

    const file = files[0]
    
    // Validate file
    const validation = FileService.validateFile(file)
    if (!validation.isValid) {
      onUploadError?.(validation.error || 'Invalid file')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const uploadedFile = await FileService.uploadFile(
        file,
        user.id,
        (progress) => setUploadProgress(progress)
      )
      
      onUploadComplete?.(uploadedFile)
      setUploadProgress(100)
      
      // Reset after a short delay
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 1000)
    } catch (error) {
      console.error('Upload error:', error)
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInputChange}
        accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.mp3,.wav,.mp4,.webm"
        className="hidden"
        disabled={isUploading}
      />
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative w-full border-2 border-dashed rounded-xl py-12 flex flex-col items-center cursor-pointer
          transition-all duration-200
          ${isDragOver 
            ? 'border-primary bg-primary/10' 
            : 'border-gray-600 hover:border-primary/50 hover:bg-gray-800/30'
          }
          ${isUploading ? 'pointer-events-none opacity-75' : ''}
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 mb-4 relative">
              <div className="absolute inset-0 border-4 border-gray-600 rounded-full"></div>
              <div 
                className="absolute inset-0 border-4 border-primary rounded-full transition-all duration-300"
                style={{
                  clipPath: `polygon(0 0, ${uploadProgress}% 0, ${uploadProgress}% 100%, 0% 100%)`
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
            <p className="text-lg font-medium text-primary mb-2">Uploading...</p>
            <p className="text-sm text-gray-400">{Math.round(uploadProgress)}% complete</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 mb-4 text-primary">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-4 text-primary">
              {isDragOver ? 'Drop your file here' : 'Upload any files from Class'}
            </p>
            <p className="text-primary underline mb-4 hover:text-secondary transition-colors">
              Click to upload or drag and drop
            </p>
          </>
        )}
      </div>
    </div>
  )
}