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
  input: SourceInput
): Promise<string> {
  // 1. Upload file to Firebase Storage
  const storageRef = ref(storage, `notebooks/${notebookId}/sources/${input.file.name}`)

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
    contentType: getMimeType(input.file.name)
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
    url,
    size: input.file.size,
    uploadedAt: Timestamp.now(),
    extractedText: extractedText,
    type: input.type
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
      type: data.type
    })
  })

  return sources
}

// Function to delete a source
export async function deleteSource(notebookId: string, sourceId: string): Promise<void> {
  const docRef = doc(db, `notebooks/${notebookId}/sources`, sourceId)
  await deleteDoc(docRef)
}

// Function to get all sources by trying multiple approaches
export async function getAllUserSources(userId: string): Promise<Source[]> {
  console.log('getAllUserSources called for user:', userId)

  try {
    const allSources: Source[] = []
    const seenUrls = new Set<string>() // Track URLs to prevent duplicates

    // Approach 1: Try Global PDFs collection first
    try {
      console.log('Trying global PDFs collection...')
      const pdfsRef = collection(db, 'pdfs')
      const pdfsSnapshot = await getDocs(pdfsRef)

      console.log('Found', pdfsSnapshot.size, 'documents in global PDFs collection')
      pdfsSnapshot.forEach(async (doc) => {
        const data = doc.data()
        const url = data.url || data.downloadURL || data.fileURL || ''

        // Skip if URL has already been seen
        if (url && seenUrls.has(url)) return

        console.log('PDF document: ', { id: doc.id, ...data })

        if (url) seenUrls.add(url)

        allSources.push({
          id: doc.id,
          notebookId: data.notebookId || 'global-pdfs',
          name: data.name || data.fileName || data.title || doc.id,
          url,
          size: data.size || data.fileSize || 0,
          uploadedAt: data.uploadedAt?.toDate() || data.createdAt?.toDate() || data.timestamp?.toDate() || new Date(),
          extractedText: data.extractedText || data.text || '',
          type: data.type || 'pdf'
        })
      })
    } catch (error) {
      console.log('Error accessing global PDFs collection:', error)
    }

    // Approach 2: Check user's notebooks for sources
    try {
      const { getUserNotebooks } = await import('./notebook')
      const userNotebooks = await getUserNotebooks(userId)
      console.log('Found', userNotebooks.length, 'notebooks for user:', userId)

      for (const notebook of userNotebooks) {
        try {
          console.log(`Checking sources for notebook: ${notebook.id} (${notebook.name})`)
          const sources = await getNotebookSources(notebook.id)
          console.log(`Found ${sources.length} sources in notebook: ${notebook.id}`)

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

    console.log('Found a total of ', allSources.length, 'sources across all approaches')
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
    const { collection, getDocs, addDoc, query, where, Timestamp } = await import('firebase/firestore')

    console.log('Starting syncStorageWithFirestore...')

    // 1. Get all files from Storage
    const listRef = ref(storage, 'pdfs')
    const res = await listAll(listRef)
    console.log(`Found ${res.items.length} files in storage/pdfs`)

    // 2. Get all documents from Firestore
    const pdfsRef = collection(db, 'pdfs')
    const snapshot = await getDocs(pdfsRef)
    const existingUrls = new Set<string>()
    snapshot.forEach(doc => {
      const data = doc.data()
      if (data.url) existingUrls.add(data.url)
    })
    console.log(`Found ${existingUrls.size} existing documents in firestore/pdfs`)

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

        console.log(`Adding missing file to Firestore: ${itemRef.name}`)

        await addDoc(pdfsRef, {
          name: itemRef.name,
          url,
          size: metadata.size,
          type: 'pdf',
          uploadedAt: metadata.timeCreated ? Timestamp.fromDate(new Date(metadata.timeCreated)) : Timestamp.now(),
          notebookId: 'public-repository',
          extractedText: ''
        })

        addedCount++
      } catch (err) {
        console.error(`Error processing file ${itemRef.name}:`, err)
      }
    }

    console.log(`Sync complete. Added ${addedCount} missing documents.`)
    return addedCount
  } catch (error) {
    console.error('Error syncing storage with firestore:', error)
    throw error
  }
}