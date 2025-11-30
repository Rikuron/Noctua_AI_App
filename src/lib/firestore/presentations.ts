import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../firebase'
import type { Presentation } from '../../types/presentation'
import { generatePresentation } from '../gemini'
import { getNotebookSources } from './sources'

// Function to generate a presentation for a notebook
export async function generateAndSavePresentation(
  notebookId: string,
  selectedSourceIds?: string[],
  title?: string
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

  // 4. Generate presentation using Gemini API
  const { title: presentationTitle, content: presentationContent } = await generatePresentation(sourceTexts, title)

  // 5. Save to Firestore with source information
  const presentationsRef = collection(db, `notebooks/${notebookId}/presentations`)
  const docRef = await addDoc(presentationsRef, {
    title: presentationTitle,
    content: presentationContent,
    generatedAt: Timestamp.now(),
    sourceIds: sources.map(s => s.id),
    sourceNames: sources.map(s => s.name)
  })

  return docRef.id
}

// Function to fetch all presentations for a notebook
export async function getNotebookPresentations(notebookId: string): Promise<Presentation[]> {
  const presentationsRef = collection(db, `notebooks/${notebookId}/presentations`)
  const q = query(presentationsRef, orderBy('generatedAt', 'desc'))
  const querySnapshot = await getDocs(q)

  const presentations: Presentation[] = []
  querySnapshot.forEach((doc) => {
    const data = doc.data()
    presentations.push({
      id: doc.id,
      notebookId,
      title: data.title,
      content: data.content,
      generatedAt: data.generatedAt.toDate(),
      sourceIds: data.sourceIds || [],
      sourceNames: data.sourceNames || []
    })
  })

  return presentations
}

