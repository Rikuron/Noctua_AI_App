import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

interface PDFDocument {
  id: string
  name: string
  url: string
  size: number
  uploadedAt: Date
  type: string
}

export function usePDFs() {
  const [pdfs, setPdfs] = useState<PDFDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPDFs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if Firebase is available
      if (!db) {
        console.warn('Firebase not initialized, using mock data')
        // Return mock data for testing
        setPdfs([
          {
            id: '1',
            name: 'Sample Document.pdf',
            url: '#',
            size: 1024000,
            uploadedAt: new Date(),
            type: 'application/pdf'
          }
        ])
        setLoading(false)
        return
      }
      
      const pdfsRef = collection(db, 'pdfs')
      const querySnapshot = await getDocs(pdfsRef)
      
      const pdfList: PDFDocument[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        pdfList.push({
          id: doc.id,
          name: data.name,
          url: data.url,
          size: data.size,
          uploadedAt: data.uploadedAt.toDate(),
          type: data.type
        })
      })
      
      pdfList.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      setPdfs(pdfList)
    } catch (err) {
      setError('Failed to fetch PDFs')
      console.error('Error fetching PDFs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPDFs()
  }, [])

  return { pdfs, loading, error, refetch: fetchPDFs }
}
