import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../firebase'
import type { Flashcard } from '../../types/flashcard'
import { generateFlashcards } from '../gemini'
import { getNotebookSources } from './sources'

// Function to generate flashcards for a notebook
export async function generateAndSaveFlashcards(
  notebookId: string,
  selectedSourceIds?: string[],
  numCards?: number
): Promise<string> {
  // 1. Get all sources for the notebook
  const allSources = await getNotebookSources(notebookId)

  if (allSources.length === 0) throw new Error('No sources found for notebook')

  // 2. Filter to selected sources if provided, otherwise use all
  const sources = selectedSourceIds && selectedSourceIds.length > 0
    ? allSources.filter(s => selectedSourceIds.includes(s.id))
    : allSources

  if (sources.length === 0) throw new Error('No readable text found in sources')

  // 3. Extract text from selected sources
  const sourceTexts = sources
    .map(s => s.extractedText)
    .filter(text => text && text !== 'Failed to extract text from PDF. Please try again.')

  if (sourceTexts.length === 0) throw new Error('No readable text found in sources')

  // 4. Generate flashcards using Gemini API
  const { title, cards } = await generateFlashcards(sourceTexts, numCards)

  // 5. Save to Firestore with source information
  const flashcardsRef = collection(db, `notebooks/${notebookId}/flashcards`)
  const docRef = await addDoc(flashcardsRef, {
    title,
    cards,
    generatedAt: Timestamp.now(),
    sourceIds: sources.map(s => s.id),
    sourceNames: sources.map(s => s.name)
  })

  return docRef.id
}

// Function to fetch all flashcards for a notebook
export async function getNotebookFlashcards(notebookId: string): Promise<Flashcard[]> {
  const flashcardsRef = collection(db, `notebooks/${notebookId}/flashcards`)
  const q = query(flashcardsRef, orderBy('generatedAt', 'desc'))
  const querySnapshot = await getDocs(q)

  const flashcards: Flashcard[] = []
  querySnapshot.forEach((doc) => {
    const data = doc.data()
    flashcards.push({
      id: doc.id,
      notebookId,
      title: data.title,
      cards: data.cards || [],
      generatedAt: data.generatedAt.toDate(),
      sourceIds: data.sourceIds || [],
      sourceNames: data.sourceNames || []
    })
  })

  return flashcards
}

