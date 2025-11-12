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
  orderBy,
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
  // Add a new notebook document to the notebooks collection
  const docRef = await addDoc(notebooksCollection, {
    userId,
    name: input.name,
    description: input.description,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  })

  return docRef.id
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
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate()
  }
}

// Function to fetch all notebooks for a user
export async function getUserNotebooks(userId: string): Promise<Notebook[]> {
  const q = query(
    notebooksCollection,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
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
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    })
  })

  return notebooks
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
