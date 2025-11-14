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

// Function to generate a summary for a notebook
export async function generateAndSaveSummary(notebookId: string): Promise<string> {
  // 1. Get all sources for the notebook
  const sources = await getNotebookSources(notebookId)

  if (sources.length === 0) throw new Error('No sources found for notebook')

  // 2. Extract text from all sources
  const sourceTexts = sources
    .map(s => s.extractedText)
    .filter(text => text && text !== 'Failed to extract text from PDF. Please try again.')

  if (sourceTexts.length === 0) throw new Error('No readable text found in sources')

  // 3. Generate summary using Gemini API
  const summaryContent = await generateSummary(sourceTexts)

  // 4. Save to Firestore
  const summariesRef = collection(db, `notebooks/${notebookId}/summaries`)
  const docRef = await addDoc(summariesRef, {
    content: summaryContent,
    generatedAt: Timestamp.now(),
    sourceIds: sources.map(s => s.id)
  })

  return docRef.id
}

// Function to fetch a summary by ID
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
      sourceIds: data.sourceIds || []
    })
  })

  return summaries
}