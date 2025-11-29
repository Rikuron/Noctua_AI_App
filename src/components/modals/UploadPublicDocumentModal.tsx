import React, { useState } from 'react'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { extractTextFromFile } from '../../lib/fileExtractor'
import { storage } from '../../firebase'
import { useAuth } from '../authProvider'
import { Modal } from './Modal'

interface UploadPublicDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: () => void
}

const getFileType = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'docx') return 'docx'
  if (ext === 'md') return 'md'
  if (ext === 'txt') return 'txt'
  return 'pdf'
}

export const UploadPublicDocumentModal: React.FC<UploadPublicDocumentModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [dragActive, setDragActive] = useState(false)
  const { user } = useAuth()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: 'pending' | 'uploading' | 'success' | 'error' }>({})
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null;

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
    
    const files = Array.from(e.dataTransfer.files).filter(f => 
      f.type === 'application/pdf' ||
      f.name.endsWith('.docx') ||
      f.name.endsWith('.md') ||
      f.name.endsWith('.txt')
    )
    setSelectedFiles(files)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files).filter(f => 
      f.type === 'application/pdf' ||
      f.name.endsWith('.docx') ||
      f.name.endsWith('.md') ||
      f.name.endsWith('.txt')
    ) : []
    setSelectedFiles(files)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one PDF, DOCX, MD, or TXT file to upload')
      return
    }
    setUploading(true)
    setError(null)
    const progress: { [key: string]: 'pending' | 'uploading' | 'success' | 'error' } = {}
    selectedFiles.forEach(file => {
      progress[file.name] = 'pending'
    })
    setUploadProgress(progress)

    for (const file of selectedFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 'uploading' }))
        const storageRef = ref(storage, `public-sources/${file.name}`)

        const metadata = {
          customMetadata: {
            uploadedBy: user?.displayName || user?.email || 'Unknown'
          }
        }

        const uploadTask = uploadBytesResumable(storageRef, file, metadata)

        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed',
            null,
            (error) => {
              setUploadProgress(prev => ({ ...prev, [file.name]: 'error' }))
              setError(`Failed to upload ${file.name}`)
              reject(error)
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(storageRef)

                // Extract text from file
                let extractedText = ''
                try {
                  extractedText = await extractTextFromFile(file)
                } catch (error) {
                  console.error('Error extracting text from file:', error)
                }

                // Create Firestore record
                const { collection, addDoc, Timestamp } = await import('firebase/firestore')
                const { db } = await import('../../firebase')

                await addDoc(collection(db, 'public-sources'), {
                  name: file.name,
                  url: downloadURL,
                  size: file.size,
                  type: getFileType(file.name),
                  uploadedAt: Timestamp.now(),
                  notebookId: 'public-repository',
                  extractedText: extractedText,
                  uploadedBy: user?.displayName || user?.email || 'Unknown',
                  uploaderId: user?.uid
                })
              } catch (firestoreError) {
                console.error('Error creating Firestore record:', firestoreError)              
              }

              setUploadProgress(prev => ({ ...prev, [file.name]: 'success' }))
              resolve()
            }
          )
        })
      } catch (err) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 'error' }))
        setError(`Failed to upload ${file.name}`)
      }
    }

    setUploading(false)
    setTimeout(() => {
      onUpload()
      onClose()
    }, 1000)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Noctua AI"
      icon={<span className="text-white font-semibold">📄</span>}
      iconWrapperClassName="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center"
      size="md"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Add public document</h3>
          <p className="text-sm text-gray-400">
            Upload Source Materials to the centralized repository.<br />
            These documents will be available to all users and notebooks.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive
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
          <h3 className="text-lg font-medium mb-2">Upload public source materials</h3>
          <p className="text-sm text-gray-400 mb-4">
            Drag & drop or{' '}
            <label className="text-blue-400 underline hover:text-blue-300 cursor-pointer">
              choose file
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
              />
            </label>{' '}to upload
          </p>
          <p className="text-xs text-gray-500">
            Supported file type: PDF, DOCX, MD, TXT
          </p>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="mt-6 text-left">
              <h4 className="text-sm font-semibold mb-3">Selected files ({selectedFiles.length}):</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
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
              disabled={uploading}
              className="w-full mt-6 py-3 bg-blue-600 cursor-pointer hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
