import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

interface PublicSource {
  id: string
  name: string
  url: string
  size: number
  uploadedAt: Date
  type: string
  uploadedBy: string
}

/**
 * Fetches the list of public sources available in the repository.
 * Falls back to mock data if Firebase is not initialized.
 * 
 * @returns Object containing the list of public sources, loading state, error, and refetch function
 */
export function usePublicSources() {
  const [sources, setSources] = useState<PublicSource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPublicSources = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if Firebase is available
      if (!db) {
        console.warn('Firebase not initialized, using mock data')
        // Return mock data for testing
        setSources([
          {
            id: '1',
            name: 'Sample Document.pdf',
            url: '#',
            size: 1024000,
            uploadedAt: new Date(),
            type: 'application/pdf',
            uploadedBy: 'Noctua AI'
          }
        ])
        setLoading(false)
        return
      }
      
      const publicSourcesRef = collection(db, 'public-sources')
      const querySnapshot = await getDocs(publicSourcesRef)
      
      const publicSourcesList: PublicSource[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        publicSourcesList.push({
          id: doc.id,
          name: data.name,
          url: data.url,
          size: data.size,
          uploadedAt: data.uploadedAt.toDate(),
          type: data.type,
          uploadedBy: data.uploadedBy
        })
      })
      
      publicSourcesList.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      setSources(publicSourcesList)
    } catch (err) {
      setError('Failed to fetch public sources')
      console.error('Error fetching public sources:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPublicSources()
  }, [])

  return { sources, loading, error, refetch: fetchPublicSources }
}
