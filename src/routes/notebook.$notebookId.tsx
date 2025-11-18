import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../components/authProvider'
import { UploadSourcesModal } from '../components/ui/uploadSourcesModal'
import { SummaryModal } from '../components/ui/summaryModal'
import { CustomScrollbarStyles } from '../components/CustomScrollbar'
import { getNotebook } from '../lib/firestore/notebook'
import type { Notebook } from '../types/notebook'
import { useNotebookSources } from '../hooks/useNotebookSources'
import { useChatHistory } from '../hooks/useChatHistory'
import { useGlobalPdfs } from '../hooks/useGlobalPdfs'
import { SourcesSidebar } from '../components/sections/SourcesSidebar'
import { ChatArea } from '../components/sections/ChatArea'
import { NotebookHeader } from '../components/sections/NotebookHeader'
import { MobileTabs } from '../components/sections/MobileTabs'
import { StudioSidebar } from '../components/sections/StudioSidebar'
import { AppLoader } from '../components/ui/AppLoader'

export const Route = createFileRoute('/notebook/$notebookId')({
  component: NotebookDetail,
})

function NotebookDetail() {
  const { notebookId } = Route.useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Custom hooks - replace all the manual fetching
  const { sources: chatbotSources, refetch: refetchSources } = useNotebookSources(notebookId)
  const { messages: chatMessages, sending: chatLoading, sendMessage } = useChatHistory(notebookId)
  const { pdfs: globalPdfs, loading: pdfsLoading, error: pdfsError } = useGlobalPdfs()
  
  // UI state only
  const [activeSourceIds, setActiveSourceIds] = useState<string[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [sourceFilter, setSourceFilter] = useState<'all' | 'uploaded' | 'repository'>('all')
  const [activeTab, setActiveTab] = useState<'chat' | 'sources' | 'studio'>('chat')
  const [notebook, setNotebook] = useState<Notebook | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Auto-activate all sources when they load
  useEffect(() => {
    if (chatbotSources.length > 0) {
      setActiveSourceIds(chatbotSources.map(s => s.id))
    }
  }, [chatbotSources])

  useEffect(() => {
    async function loadNotebook() {
      if (!user) return
      
      try {
        const notebookData = await getNotebook(notebookId)
        if (notebookData) {
          setNotebook(notebookData)
        } else {
          console.log('Notebook not found in database, creating fallback...')
          const fallbackNotebook: Notebook = {
            id: notebookId,
            userId: user.uid,
            name: 'New Workspace',
            description: 'Your document workspace',
            createdAt: new Date(),
            updatedAt: new Date()
          }
          setNotebook(fallbackNotebook)
        }
      } catch (error) {
        console.error('Error loading notebook:', error)
        const fallbackNotebook: Notebook = {
          id: notebookId,
          userId: user.uid,
          name: 'New Workspace',
          description: 'Your document workspace',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        setNotebook(fallbackNotebook)
      } finally {
        setLoading(false)
      }
    }

    loadNotebook()
  }, [notebookId, user])

  // Get user initial for profile
  const getUserInitial = () => {
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  if (loading) {
    return <AppLoader fullscreen label="Loading notebook..." />
  }

  if (!notebook) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Notebook not found</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-gray-900 text-white overflow-hidden">
      <CustomScrollbarStyles />

      <div className="shrink-0">
        <NotebookHeader
          notebook={notebook}
          userInitial={getUserInitial()}
          onNavigateBack={() => navigate({ to: '/' })}
          onUpdateNotebook={async (name) => {
            const { updateNotebook } = await import('../lib/firestore/notebook')
            await updateNotebook(notebook.id, { name })
            setNotebook({ ...notebook, name })
          }}
        />
      </div>

      <div className="shrink-0">
        <MobileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        <SourcesSidebar
          activeTab={activeTab}
          chatbotSources={chatbotSources}
          globalPdfs={globalPdfs}
          pdfsLoading={pdfsLoading}
          pdfsError={pdfsError}
          activeSourceIds={activeSourceIds}
          sourceFilter={sourceFilter}
          notebookId={notebookId}
          onShowUploadModal={() => setShowUploadModal(true)}
          onToggleSource={(sourceId) => {
            setActiveSourceIds(ids =>
              ids.includes(sourceId) ? ids.filter(id => id !== sourceId) : [...ids, sourceId]
            )
          }}
          onDeleteSource={async (sourceId) => {
            try {
              const { db } = await import('../firebase')
              const { doc, deleteDoc } = await import('firebase/firestore')
              await deleteDoc(doc(db, 'notebooks/' + notebookId + '/sources', sourceId))
              await refetchSources()
              setActiveSourceIds(activeSourceIds.filter(id => id !== sourceId))
            } catch (err: any) {
              alert('Failed to delete source: ' + (err?.message || String(err)))
            }
          }}
          onAddGlobalPdfToWorkspace={async (pdf) => {
            try {
              const { db } = await import('../firebase')
              const { collection: fsCollection, addDoc } = await import('firebase/firestore')
              let extractedText = ''
              try {
                const response = await fetch(pdf.url)
                const blob = await response.blob()
                const file = new File([blob], pdf.fileName, { type: 'application/pdf' })
                const { extractTextFromPDF } = await import('../lib/pdfExtractor')
                extractedText = await extractTextFromPDF(file)
              } catch (extractError) {
                console.error('Failed to extract text:', extractError)
                extractedText = 'Failed to extract text from PDF.'
              }
              const sourcesRef = fsCollection(db, 'notebooks/' + notebookId + '/sources')
              await addDoc(sourcesRef, {
                name: pdf.fileName,
                url: pdf.url,
                size: pdf.size,
                uploadedAt: pdf.uploadedAt,
                type: 'pdf',
                extractedText,
                fromRepository: true
              })
              await refetchSources()
            } catch (err: any) {
              alert('Failed to add PDF: ' + (err?.message || String(err)))
            }
          }}
          onRefetchSources={refetchSources}
          setSourceFilter={setSourceFilter}
        />

        <div className="flex flex-1 min-h-0">
          <ChatArea
            activeTab={activeTab}
            chatMessages={chatMessages}
            chatLoading={chatLoading}
            pdfsError={pdfsError}
            onSendMessage={sendMessage}
          />

          <StudioSidebar
            activeTab={activeTab}
            onShowSummaryModal={() => setShowSummaryModal(true)}
          />
        </div>
      </div>

      <UploadSourcesModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        notebookId={notebookId}
        onUpload={() => {
          setShowUploadModal(false)
          refetchSources()
        }}
      />

      <SummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        notebookId={notebookId}
      />
    </div>
  )
}