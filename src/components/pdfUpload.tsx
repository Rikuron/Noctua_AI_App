import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, setDoc } from 'firebase/firestore'
import { storage, db } from '../firebase'

interface PDFUploadProps {
  onUploadSuccess: (pdfUrl: string, pdfName: string) => void
}

export function PDFUpload({ onUploadSuccess }: PDFUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Create a unique filename
      const timestamp = Date.now()
      const fileName = `pdfs/${timestamp}_${file.name}`
      const storageRef = ref(storage, fileName)

      // Upload file to Firebase Storage
      const uploadTask = uploadBytes(storageRef, file)
      await uploadTask
      setUploadProgress(100)

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)

      // Save metadata to Firestore
      const pdfDoc = {
        name: file.name,
        url: downloadURL,
        size: file.size,
        uploadedAt: new Date(),
        type: 'pdf'
      }

      await setDoc(doc(db, 'pdfs', `${timestamp}_${file.name}`), pdfDoc)

      onUploadSuccess(downloadURL, file.name)
    } catch (error) {
      console.error('Error uploading PDF:', error)
      alert('Failed to upload PDF. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  })

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/10'
            : 'border-gray-600 hover:border-gray-500'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={uploading} />
        <div className="flex flex-col items-center gap-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {uploading ? (
            <div className="w-full">
              <div className="text-sm text-gray-400 mb-2">Uploading PDF...</div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="text-lg font-medium text-white mb-2">
                {isDragActive ? 'Drop your PDF here' : 'Upload a PDF'}
              </div>
              <div className="text-sm text-gray-400">
                Drag and drop a PDF file, or click to select
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
