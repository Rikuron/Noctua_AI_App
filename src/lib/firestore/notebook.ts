import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../firebase'
import type { Notebook, NotebookInput } from '../../types/notebook'

// Reference to Notebooks Collection in Firebase DB/Firestore
const notebooksCollection = collection(db, 'notebooks')

// Function to Create a New Notebook
// Returns the new notebook's ID
export async function createNotebook(
  userId: string,
  input: NotebookInput
): Promise<string> {
  try {
    // Check if db is available
    if (!db) {
      throw new Error('Firebase not initialized. Please check your configuration.')
    }

    // Add a new notebook document to the notebooks collection
    const docRef = await addDoc(notebooksCollection, {
      userId,
      name: input.name,
      description: input.description,
      icon: input.icon ?? '📓',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })

    return docRef.id
  } catch (error: any) {
    console.error('Error creating notebook:', error)
    
    // Handle specific Firebase errors
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to create notebooks. Please ensure you are properly authenticated.')
    } else if (error.code === 'unauthenticated') {
      throw new Error('You must be signed in to create notebooks.')
    } else if (error.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please try again later.')
    } else {
      throw new Error(`Failed to create notebook: ${error.message}`)
    }
  }
}

// Function to fetch Notebook by ID
export async function getNotebook(notebookId: string): Promise<Notebook | null> {
  const docRef = doc(db, 'notebooks', notebookId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) return null

  const data = docSnap.data()
  return {
    id: docSnap.id,
    userId: data.userId,
    name: data.name,
    description: data.description,
    icon: data.icon ?? '📓',
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate()
  }
}

// Function to fetch all notebooks for a user
export async function getUserNotebooks(userId: string): Promise<Notebook[]> {
  const q = query(
    notebooksCollection,
    where('userId', '==', userId)
    // Removed orderBy to avoid index requirement - we'll sort in JavaScript
  )

  const querySnapshot = await getDocs(q)
  const notebooks: Notebook[] = []

  querySnapshot.forEach((doc) => {
    const data = doc.data()
    notebooks.push({
      id: doc.id,
      userId: data.userId,
      name: data.name,
      description: data.description,
      icon: data.icon ?? '📓',
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    })
  })

  // Sort in JavaScript instead of Firestore to avoid index requirement
  return notebooks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

// Function to update a notebook
export async function updateNotebook(
  notebookId: string,
  updates: Partial<NotebookInput>
): Promise<void> {
  const docRef = doc(db, 'notebooks', notebookId)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  })
}

// Function to delete a notebook
export async function deleteNotebook(notebookId: string): Promise<void> {
  const docRef = doc(db, 'notebooks', notebookId)
  await deleteDoc(docRef)
}
