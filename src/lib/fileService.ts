import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject
} from 'firebase/storage'
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { storage, db } from './firebase'

export interface UploadedFile {
  id?: string
  name: string
  originalName: string
  size: number
  type: string
  downloadURL: string
  storagePath: string
  uploadedAt: Timestamp
  uploadedBy: string // Clerk user ID
}

export class FileService {
  // Upload a file to Firebase Storage and save metadata to Firestore
  static async uploadFile(
    file: File, 
    userId: string, 
    onProgress?: (progress: number) => void
  ): Promise<UploadedFile> {
    try {
      // Create a unique file name
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${timestamp}_${sanitizedName}`
      const storagePath = `uploads/${userId}/${fileName}`
      
      // Create storage reference
      const storageRef = ref(storage, storagePath)
      
      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file)
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Calculate progress percentage
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            onProgress?.(progress)
          },
          (error) => {
            console.error('Upload failed:', error)
            reject(error)
          },
          async () => {
            try {
              // Get download URL
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
              
              // Save metadata to Firestore
              const fileData: Omit<UploadedFile, 'id'> = {
                name: fileName,
                originalName: file.name,
                size: file.size,
                type: file.type,
                downloadURL,
                storagePath,
                uploadedAt: Timestamp.now(),
                uploadedBy: userId
              }
              
              const docRef = await addDoc(collection(db, 'uploadedFiles'), fileData)
              
              resolve({
                id: docRef.id,
                ...fileData
              })
            } catch (error) {
              console.error('Failed to save file metadata:', error)
              reject(error)
            }
          }
        )
      })
    } catch (error) {
      console.error('File upload initialization failed:', error)
      throw error
    }
  }
  
  // Get all files for a specific user
  static async getUserFiles(userId: string): Promise<UploadedFile[]> {
    try {
      const q = query(
        collection(db, 'uploadedFiles'),
        where('uploadedBy', '==', userId),
        orderBy('uploadedAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const files: UploadedFile[] = []
      
      querySnapshot.forEach((doc) => {
        files.push({
          id: doc.id,
          ...doc.data()
        } as UploadedFile)
      })
      
      return files
    } catch (error) {
      console.error('Failed to fetch user files:', error)
      throw error
    }
  }
  
  // Delete a file from both Storage and Firestore
  static async deleteFile(fileId: string, storagePath: string): Promise<void> {
    try {
      // Delete from Storage
      const storageRef = ref(storage, storagePath)
      await deleteObject(storageRef)
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'uploadedFiles', fileId))
    } catch (error) {
      console.error('Failed to delete file:', error)
      throw error
    }
  }
  
  // Get file types that are allowed
  static getAllowedFileTypes(): string[] {
    return [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/webm'
    ]
  }
  
  // Validate file type and size
  static validateFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = this.getAllowedFileTypes()
    const maxSize = 50 * 1024 * 1024 // 50MB
    
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not supported. Please upload PDF, PowerPoint, Word documents, text files, audio, or video files.'
      }
    }
    
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size too large. Maximum size is 50MB.'
      }
    }
    
    return { isValid: true }
  }
}