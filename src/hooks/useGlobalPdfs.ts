import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

interface GlobalPdf {
  id: string
  fileName: string
  url: string
  size: number
  uploadedAt: Date
  type: string
}

interface UseGlobalPdfsResult {
  pdfs: GlobalPdf[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to manage global repository PDFs
 * Fetches PDFs from the global 'pdfs' collection
 */
export function useGlobalPdfs(): UseGlobalPdfsResult {
  const [pdfs, setPdfs] = useState<GlobalPdf[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPdfs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!db) throw new Error('Firebase not initialized')

      const pdfsRef = collection(db, 'pdfs')
      const querySnapshot = await getDocs(pdfsRef)

      const pdfList: GlobalPdf[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        pdfList.push({
          id: doc.id,
          fileName: data.name || data.fileName || data.title || 'Untitled',
          url: data.url || '',
          size: data.size || 0,
          uploadedAt: data.uploadedAt?.toDate?.() || new Date(),
          type: data.type || 'pdf'
        })
      })

      // Sort by upload date (newest first)
      const sortedPdfs = pdfList.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      setPdfs(sortedPdfs)
    } catch (err: any) {
      console.error('Error fetching global PDFs: ', err)
      setError('Failed to fetch PDFs. Please try again.')
      setPdfs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPdfs()
  }, [fetchPdfs])

  return { pdfs, loading, error, refetch: fetchPdfs }
}