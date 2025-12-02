import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../firebase'
import type { Quiz } from '../../types/quiz'
import { generateQuiz } from '../gemini'
import { getNotebookSources } from './sources'

/**
 * Generates a quiz from notebook sources using AI and saves it to Firestore.
 * 
 * @param notebookId - The ID of the notebook
 * @param selectedSourceIds - Optional list of source IDs to use
 * @param numQuestions - Optional number of questions to generate
 * @returns Promise resolving to the new quiz ID
 * @throws Error if no sources are found or no text can be extracted
 */
export async function generateAndSaveQuiz(
  notebookId: string,
  selectedSourceIds?: string[],
  numQuestions?: number
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

  // 4. Generate quiz using Gemini API
  const { title, questions } = await generateQuiz(sourceTexts, numQuestions)

  // 5. Save to Firestore with source information
  const quizzesRef = collection(db, `notebooks/${notebookId}/quizzes`)
  const docRef = await addDoc(quizzesRef, {
    title,
    questions,
    generatedAt: Timestamp.now(),
    sourceIds: sources.map(s => s.id),
    sourceNames: sources.map(s => s.name)
  })

  return docRef.id
}

/**
 * Retrieves all quizzes for a notebook, ordered by generation date.
 * 
 * @param notebookId - The ID of the notebook
 * @returns Promise resolving to an array of Quiz objects
 */
export async function getNotebookQuizzes(notebookId: string): Promise<Quiz[]> {
  const quizzesRef = collection(db, `notebooks/${notebookId}/quizzes`)
  const q = query(quizzesRef, orderBy('generatedAt', 'desc'))
  const querySnapshot = await getDocs(q)

  const quizzes: Quiz[] = []
  querySnapshot.forEach((doc) => {
    const data = doc.data()
    quizzes.push({
      id: doc.id,
      notebookId,
      title: data.title,
      questions: data.questions || [],
      generatedAt: data.generatedAt.toDate(),
      sourceIds: data.sourceIds || [],
      sourceNames: data.sourceNames || []
    })
  })

  return quizzes
}

