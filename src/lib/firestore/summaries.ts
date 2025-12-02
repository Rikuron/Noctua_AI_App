import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../firebase'
import type { Summary } from '../../types/summary'
import { generateSummary } from '../gemini'
import { getNotebookSources } from './sources'

/**
 * Generates a summary from notebook sources using AI and saves it to Firestore.
 * 
 * @param notebookId - The ID of the notebook
 * @param selectedSourceIds - Optional list of source IDs to use
 * @returns Promise resolving to the new summary ID
 * @throws Error if no sources are found or no text can be extracted
 */
export async function generateAndSaveSummary(
  notebookId: string,
  selectedSourceIds?: string[]
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

  // 4. Generate summary using Gemini API
  const summaryContent = await generateSummary(sourceTexts)

  // 5. Save to Firestore with source information
  const summariesRef = collection(db, `notebooks/${notebookId}/summaries`)
  const docRef = await addDoc(summariesRef, {
    content: summaryContent,
    generatedAt: Timestamp.now(),
    sourceIds: sources.map(s => s.id),
    sourceNames: sources.map(s => s.name)
  })

  return docRef.id
}

/**
 * Retrieves all summaries for a notebook, ordered by generation date.
 * 
 * @param notebookId - The ID of the notebook
 * @returns Promise resolving to an array of Summary objects
 */
export async function getNotebookSummaries(notebookId: string): Promise<Summary[]> {
  const summariesRef = collection(db, `notebooks/${notebookId}/summaries`)
  const q = query(summariesRef, orderBy('generatedAt', 'desc'))
  const querySnapshot = await getDocs(q)

  const summaries: Summary[] = []
  querySnapshot.forEach((doc) => {
    const data = doc.data()
    summaries.push({
      id: doc.id,
      notebookId,
      content: data.content,
      generatedAt: data.generatedAt.toDate(),
      sourceIds: data.sourceIds || [],
      sourceNames: data.sourceNames || []
    })
  })

  return summaries
}