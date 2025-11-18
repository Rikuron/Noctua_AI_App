import { useState, useEffect } from 'react'
import { getUserNotebooks, deleteNotebook as deleteNotebookFirestore } from '../lib/firestore/notebook'
import { getNotebookSources } from '../lib/firestore/sources'
import type { Notebook } from '../types/notebook'

export function useNotebooks(userId: string | undefined) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [sourceCounts, setSourceCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      loadNotebooks()
    }
  }, [userId])

  const loadNotebooks = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)
      
      const userNotebooks = await getUserNotebooks(userId)
      
      // Filter out empty untitled notebooks
      const filteredNotebooks = userNotebooks.filter(notebook => 
        notebook.name !== 'Untitled notebook' || notebook.description !== ''
      )
      setNotebooks(filteredNotebooks)
      
      // Cleanup empty untitled notebooks
      const untitledNotebooks = userNotebooks.filter(notebook => 
        notebook.name === 'Untitled notebook' && notebook.description === ''
      )
      
      if (untitledNotebooks.length > 0) {
        console.log(`Cleaning up ${untitledNotebooks.length} empty untitled notebooks...`)
        for (const notebook of untitledNotebooks) {
          try {
            await deleteNotebookFirestore(notebook.id)
          } catch (err) {
            console.error(`Failed to delete notebook ${notebook.id}:`, err)
          }
        }
      }
      
      // Load source counts
      const counts: Record<string, number> = {}
      for (const notebook of filteredNotebooks) {
        try {
          const sources = await getNotebookSources(notebook.id)
          counts[notebook.id] = sources.length
        } catch (error) {
          console.error(`Error loading sources for notebook ${notebook.id}:`, error)
          counts[notebook.id] = 0
        }
      }
      setSourceCounts(counts)
    } catch (error: any) {
      console.error('Failed to load notebooks:', error)
      if (error.code === 'permission-denied') {
        setError('Unable to access notebooks. Please configure Firestore security rules.')
      } else {
        setError('Failed to load notebooks. Please try again.')
      }
      setNotebooks([])
    } finally {
      setLoading(false)
    }
  }

  const deleteNotebook = async (notebookId: string) => {
    try {
      await deleteNotebookFirestore(notebookId)
      setNotebooks(prev => prev.filter(n => n.id !== notebookId))
      setSourceCounts(prev => {
        const newCounts = { ...prev }
        delete newCounts[notebookId]
        return newCounts
      })
    } catch (error: any) {
      console.error('Failed to delete notebook:', error)
      throw error
    }
  }

  return {
    notebooks,
    sourceCounts,
    loading,
    error,
    refetch: loadNotebooks,
    deleteNotebook
  }
}