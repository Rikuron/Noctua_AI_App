import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase'
import type { Source, SourceInput } from '../../types/source'
import { extractTextFromFile } from '../fileExtractor'

// Function to add a new source to a notebook
export async function addSource(
  notebookId: string,
  input: SourceInput,
  userId: string
): Promise<string> {
  const safeName = input.file.name
    .replace(/[^a-zA-Z0-9-_\.]/g, '_')
    .replace(/_+/g, '_')

  // 1. Upload file to Firebase Storage
  const storageRef = ref(storage, `notebooks/${notebookId}/sources/${safeName}`)

  // Helper to force correct MIME types
  const getMimeType = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return 'application/pdf'
    if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    if (ext === 'md') return 'text/markdown'
    if (ext === 'txt') return 'text/plain'
    return 'application/octet-stream'
  }

  const metadata = {
    contentType: getMimeType(input.file.name),
    customMetadata: {
      userId: userId,
      notebookId: notebookId,
      originalName: input.file.name,
    }
  }

  await uploadBytes(storageRef, input.file, metadata)
  const url = await getDownloadURL(storageRef)

  // 2. Extract text from the uploaded file
  let extractedText = ''
  try {
    extractedText = await extractTextFromFile(input.file)
  } catch (error) {
    console.error('Error extracting text from file:', error)
    extractedText = 'Failed to extract text from file. Please try again.'
  }

  // 3. Save to Firestore
  const sourcesRef = collection(db, `notebooks/${notebookId}/sources`)
  const docRef = await addDoc(sourcesRef, {
    name: input.file.name,
    storageName: safeName,
    url,
    size: input.file.size,
    uploadedAt: Timestamp.now(),
    extractedText: extractedText,
    type: input.type,
    userId: userId
  })

  return docRef.id
}

// Function to fetch all sources for a notebook
export async function getNotebookSources(notebookId: string): Promise<Source[]> {
  const sourcesRef = collection(db, `notebooks/${notebookId}/sources`)
  const querySnapshot = await getDocs(sourcesRef)

  const sources: Source[] = []
  querySnapshot.forEach((doc) => {
    const data = doc.data()
    sources.push({
      id: doc.id,
      notebookId,
      name: data.name,
      url: data.url,
      size: data.size,
      uploadedAt: data.uploadedAt.toDate(),
      extractedText: data.extractedText,
      type: data.type,
      fromRepository: data.fromRepository
    })
  })

  return sources
}

// Function to delete a source
export async function deleteSource(notebookId: string, sourceId: string): Promise<void> {
  const docRef = doc(db, `notebooks/${notebookId}/sources`, sourceId)
  await deleteDoc(docRef)
}

// Function to delete a public document from the global pdfs collection
export async function deletePublicDocument(documentId: string): Promise<void> {
  // Delete the Firestore document and its corresponding storage file
  const docRef = doc(db, 'public-sources', documentId)

  // Get the document to retrieve the file name
  const { getDoc } = await import('firebase/firestore')
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    const data = docSnap.data() as any
    const fileName = data.name
    
    if (fileName) {
      const { deleteObject } = await import('firebase/storage')
      
      try {
        const newStorageRef = ref(storage, `public-sources/${fileName}`)
        await deleteObject(newStorageRef)
      } catch (Err) {
        console.error('Failed to delete storage file:', Err)
      }
    }
  }

  // Finally delete the Firestore document
  await deleteDoc(docRef)
}

// Function to get all sources by trying multiple approaches
export async function getAllUserSources(userId: string): Promise<Source[]> {
  try {
    const allSources: Source[] = []
    const seenUrls = new Set<string>() // Track URLs to prevent duplicates

    // Approach 1: Try Global Public Sources collection first
    try {
      const publicSourcesRef = collection(db, 'public-sources')
      const publicSourcesSnapshot = await getDocs(publicSourcesRef)

      publicSourcesSnapshot.forEach(async (doc) => {
        const data = doc.data()
        const url = data.url || data.downloadURL || data.fileURL || ''

        // Skip if URL has already been seen
        if (url && seenUrls.has(url)) return

        if (url) seenUrls.add(url)

        allSources.push({
          id: doc.id,
          notebookId: data.notebookId || 'public-repository',
          name: data.name || data.fileName || data.title || doc.id,
          url,
          size: data.size || data.fileSize || 0,
          uploadedAt: data.uploadedAt?.toDate() || data.createdAt?.toDate() || data.timestamp?.toDate() || new Date(),
          extractedText: data.extractedText || data.text || '',
          type: data.type || 'pdf',
          uploadedBy: data.uploadedBy || 'Unknown',
          uploaderId: data.uploaderId || 'Unknown'
        })
      })
    } catch (error) {
      console.log('Error accessing global public-sources collection:', error)
    }

    // Approach 2: Check user's notebooks for sources
    try {
      const { getUserNotebooks } = await import('./notebook')
      const userNotebooks = await getUserNotebooks(userId)

      for (const notebook of userNotebooks) {
        try {
          const sources = await getNotebookSources(notebook.id)

          // Add sources, skipping duplicates
          sources.forEach(source => {
            if (source.url && seenUrls.has(source.url)) return

            if (source.url) seenUrls.add(source.url)
            allSources.push(source)
          })
        } catch (error) {
          console.log(`Error checking sources for notebook ${notebook.id}:`, error)
        }
      }
    } catch (error) {
      console.log('Error accessing user notebooks:', error)
    }

    return allSources

  } catch (error) {
    console.error('Error in getAllUserSources:', error)
    return []
  }
}

// Function to sync Storage files with Firestore
export async function syncStorageWithFirestore(): Promise<number> {
  try {
    const { listAll, ref, getDownloadURL, getMetadata } = await import('firebase/storage')
    const { collection, getDocs, addDoc, Timestamp } = await import('firebase/firestore')

    // 1. Get all files from Storage
    const listRef = ref(storage, 'public-sources')
    const res = await listAll(listRef)

    // 2. Get all documents from Firestore
    const publicSourcesRef = collection(db, 'public-sources')
    const snapshot = await getDocs(publicSourcesRef)
    const existingUrls = new Set<string>()
    snapshot.forEach(doc => {
      const data = doc.data()
      if (data.url) existingUrls.add(data.url)
    })

    // 3. Find missing files and add them to Firestore
    let addedCount = 0

    for (const itemRef of res.items) {
      try {
        const url = await getDownloadURL(itemRef)

        // Check if this URL already exists in Firestore
        if (existingUrls.has(url)) {
          continue
        }

        // Get metadata for size and time
        const metadata = await getMetadata(itemRef)
        const uploadedBy = metadata.customMetadata?.uploadedBy || 'Unknown'

        await addDoc(publicSourcesRef, {
          name: itemRef.name,
          url,
          size: metadata.size,
          type: 'pdf',
          uploadedAt: metadata.timeCreated ? Timestamp.fromDate(new Date(metadata.timeCreated)) : Timestamp.now(),
          notebookId: 'public-repository',
          extractedText: '',
          uploadedBy: uploadedBy
        })

        addedCount++
      } catch (err) {
        console.error(`Error processing file ${itemRef.name}:`, err)
      }
    }

    return addedCount
  } catch (error) {
    console.error('Error syncing storage with firestore:', error)
    throw error
  }
}