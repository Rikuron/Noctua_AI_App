import { useState, useMemo, useEffect } from 'react'
import { getAllUserSources } from '../lib/firestore/sources'
import { usePublicSources } from './usePublicSources'
import type { Source } from '../types/source'

export function useRepositorySources(user: any) {
  const [firestoreSources, setFirestoreSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Public sources hook
  const { sources: publicSources, loading: publicLoading, error: publicError } = usePublicSources()

  // Fetch user sources
  const fetchUserSources = async () => {
    if (!user) return
    try {
      setLoading(true)
      const userSources = await getAllUserSources(user.uid)
      setFirestoreSources(userSources)
    } catch (err) {
      console.error('Error fetching user sources:', err)
      setError('Failed to load your sources')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserSources()
  }, [user])

  // Merge sources
  const allSources = useMemo(() => {
    const combined = [...firestoreSources]
    const existingUrls = new Set(firestoreSources.map(s => s.url))

    if (!publicLoading && publicSources.length > 0) {
      publicSources.forEach(source => {
        if (!existingUrls.has(source.url)) {
          combined.push({
            id: source.id,
            notebookId: 'public-repository',
            name: source.name,
            url: source.url,
            size: source.size,
            uploadedAt: source.uploadedAt,
            extractedText: '',
            type: source.type as any,
            uploadedBy: (source as any).uploadedBy
          })
        }
      })
    }
    return combined
  }, [firestoreSources, publicSources, publicLoading])

  return {
    sources: allSources,
    loading: loading || publicLoading,
    error: error || publicError,
    refetch: fetchUserSources
  }
}