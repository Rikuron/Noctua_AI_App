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
import { extractTextFromPDF } from '../pdfExtractor'


// Function to add a new source to a notebook
export async function addSource(
  notebookId: string,
  input: SourceInput
): Promise<string> {
  // 1. Upload file to Firebase Storage
  const storageRef = ref(storage, `notebooks/${notebookId}/sources/${input.file.name}`)
  await uploadBytes(storageRef, input.file)
  const url = await getDownloadURL(storageRef)

  // 2. Extract text from the uploaded file
  let extractedText = ''
  if (input.type === 'pdf') {
    try {
      extractedText = await extractTextFromPDF(input.file)
    } catch (error) {
      console.error('Error extracting text from PDF:', error)
      extractedText = 'Failed to extract text from PDF. Please try again.'
    }
  }

  // 3. Save to Firestore
  const sourcesRef= collection(db, `notebooks/${notebookId}/sources`)
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