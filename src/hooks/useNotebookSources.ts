import { useState, useEffect, useCallback } from 'react'
import { getNotebookSources } from '../lib/firestore/sources'
import type { Source } from '../types/source'

interface UseNotebookSourcesProps {
  sources: Source[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useNotebookSources(notebookId: string): UseNotebookSourcesProps {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSources = useCallback(async () => {
    if (!notebookId) return

    try {
      setLoading(true)
      setError(null)
      
      const sourcesData = await getNotebookSources(notebookId)
      setSources(sourcesData)
    } catch (err: any) {
      console.error('Error fetching sources: ', err)
      setError('Failed to load sources. Please try again.')
      setSources([])
    } finally {
      setLoading(false)
    }
  }, [notebookId])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  return { sources, loading, error, refetch: fetchSources }
}