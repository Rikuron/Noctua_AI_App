import { useState } from 'react'
import { db } from '../firebase'
import { doc, deleteDoc, collection, addDoc } from 'firebase/firestore'
import { extractTextFromFile } from '../lib/fileExtractor'

export function useNotebookActions(notebookId: string, onActionComplete?: () => void) {
  const [actionLoading, setActionLoading] = useState(false)

  const deleteSource = async (sourceId: string) => {
    try {
      setActionLoading(true)
      await deleteDoc(doc(db, 'notebooks/' + notebookId + '/sources', sourceId))
      onActionComplete?.()
    } catch (err: any) {
      console.error('Failed to delete source:', err)
      alert('Failed to delete source: ' + (err?.message || String(err)))
    } finally {
      setActionLoading(false)
    }
  }

  const addPublicSource = async (source: any) => {
    try {
      setActionLoading(true)
      let extractedText = ''
      
      try {
        const response = await fetch(source.url)
        const blob = await response.blob()
        const file = new File([blob], source.name, { type: blob.type })
        extractedText = await extractTextFromFile(file)
      } catch (extractError) {
        console.error('Failed to extract text:', extractError)
        extractedText = 'Failed to extract text from PDF.'
      }

      const sourcesRef = collection(db, 'notebooks/' + notebookId + '/sources')
      await addDoc(sourcesRef, {
        name: source.name,
        url: source.url,
        size: source.size,
        uploadedAt: source.uploadedAt,
        type: source.type,
        extractedText,
        fromRepository: true
      })
      
      if (onActionComplete) await onActionComplete()
    } catch (err: any) {
      console.error('Failed to add public source:', err)
      alert('Failed to add PDF: ' + (err?.message || String(err)))
    } finally {
      setActionLoading(false)
    }
  }

  return {
    deleteSource,
    addPublicSource,
    actionLoading
  }
}