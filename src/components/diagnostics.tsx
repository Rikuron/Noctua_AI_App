import { useState } from 'react'
import { useAuth } from '../components/authProvider'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'

export function Diagnostics() {
  const { user } = useAuth()
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    if (!user) return

    setLoading(true)
    try {
      console.log('Running comprehensive diagnostics for user:', user.uid)
      
      const results: any = {
        userId: user.uid,
        userEmail: user.email,
        collections: {},
        summary: {
          totalNotebooks: 0,
          totalSources: 0,
          accessibleCollections: [],
          blockedCollections: []
        }
      }
      
      // Check user's notebooks first
      try {
        const notebooksRef = collection(db, 'notebooks')
        const notebooksQuery = query(notebooksRef, where('userId', '==', user.uid))
        const notebooksSnapshot = await getDocs(notebooksQuery)
        
        const notebooks: any[] = []
        notebooksSnapshot.forEach((doc) => {
          notebooks.push({
            id: doc.id,
            ...doc.data()
          })
        })
        
        results.collections.notebooks = {
          exists: true,
          count: notebooks.length,
          documents: notebooks
        }
        results.summary.totalNotebooks = notebooks.length
        results.summary.accessibleCollections.push('notebooks')
        
        // For each notebook, check ALL possible subcollections
        const subcollectionsToCheck = ['sources', 'pdfs', 'files', 'documents', 'uploads', 'materials']
        
        for (const notebook of notebooks) {
          for (const subcollection of subcollectionsToCheck) {
            try {
              const subCollectionRef = collection(db, `notebooks/${notebook.id}/${subcollection}`)
              const subSnapshot = await getDocs(subCollectionRef)
              
              const docs: any[] = []
              subSnapshot.forEach((doc) => {
                docs.push({
                  id: doc.id,
                  notebookId: notebook.id,
                  notebookName: notebook.name,
                  ...doc.data()
                })
              })
              
              const collectionKey = `notebook_${notebook.id}_${subcollection}`
              results.collections[collectionKey] = {
                exists: true,
                count: docs.length,
                documents: docs
              }
              
              if (docs.length > 0) {
                results.summary.totalSources += docs.length
                results.summary.accessibleCollections.push(collectionKey)
              }
              
            } catch (error: any) {
              const collectionKey = `notebook_${notebook.id}_${subcollection}`
              results.collections[collectionKey] = {
                exists: false,
                error: error.message
              }
              if (error.message.includes('permission')) {
                results.summary.blockedCollections.push(collectionKey)
              }
            }
          }
        }
        
      } catch (error: any) {
        results.collections.notebooks = {
          exists: false,
          error: error.message
        }
        results.summary.blockedCollections.push('notebooks')
      }
      
      // Check various global collection patterns that might exist
      const globalCollections = [
        'pdfs', 'files', 'documents', 'uploads', 'materials',
        `user_${user.uid}_pdfs`, `user_${user.uid}_files`
      ]
      
      for (const collectionName of globalCollections) {
        try {
          const collectionRef = collection(db, collectionName)
          let snapshot
          
          // Try both direct access and user-filtered access
          try {
            // First try with user filter if possible
            const userQuery = query(collectionRef, where('userId', '==', user.uid))
            snapshot = await getDocs(userQuery)
          } catch {
            // If that fails, try direct access
            snapshot = await getDocs(collectionRef)
          }
          
          const docs: any[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            // Only include docs that belong to the user or have no userId
            if (!data.userId || data.userId === user.uid) {
              docs.push({
                id: doc.id,
                ...data
              })
            }
          })
          
          results.collections[collectionName] = {
            exists: true,
            count: docs.length,
            documents: docs
          }
          
          if (docs.length > 0) {
            results.summary.totalSources += docs.length
            results.summary.accessibleCollections.push(collectionName)
          }
          
        } catch (error: any) {
          results.collections[collectionName] = {
            exists: false,
            error: error.message
          }
          if (error.message.includes('permission')) {
            results.summary.blockedCollections.push(collectionName)
          }
        }
      }

      setDiagnostics(results)
    } catch (error: any) {
      console.error('Diagnostics error:', error)
      setDiagnostics({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="text-gray-400">Please sign in to run diagnostics</div>
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-4">Firebase Database Deep Scan</h3>
      <p className="text-gray-400 text-sm mb-4">Searching for your 4 PDF files across all possible locations...</p>
      
      <button
        onClick={runDiagnostics}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded mb-4"
      >
        {loading ? 'Scanning Database...' : 'Deep Scan All Locations'}
      </button>

      {diagnostics && diagnostics.summary && (
        <div className="bg-gray-700 p-3 rounded mb-4 text-sm">
          <h4 className="text-white font-medium mb-2">📊 Scan Summary</h4>
          <div className="text-gray-300">
            <p>📚 Notebooks: {diagnostics.summary.totalNotebooks}</p>
            <p>📄 Total Documents: {diagnostics.summary.totalSources}</p>
            <p>✅ Accessible: {diagnostics.summary.accessibleCollections.length}</p>
            <p>🔒 Blocked: {diagnostics.summary.blockedCollections.length}</p>
          </div>
        </div>
      )}

      {diagnostics && (
        <div className="bg-gray-900 p-4 rounded text-sm">
          <pre className="text-green-400 whitespace-pre-wrap overflow-auto max-h-96">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}