import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../components/authProvider'
import { UploadSourcesModal } from '../components/modals/UploadSourcesModal'
import { SummaryModal } from '../components/modals/SummaryModal'
import { CustomScrollbarStyles } from '../components/CustomScrollbar'
import { getNotebook } from '../lib/firestore/notebook'
import type { Notebook } from '../types/notebook'
import { useNotebookSources } from '../hooks/useNotebookSources'
import { useChatHistory } from '../hooks/useChatHistory'
import { usePublicSources } from '../hooks/usePublicSources'
import { useNotebookActions } from '../hooks/useNotebookActions'
import { SourcesSidebar } from '../components/sections/SourcesSidebar'
import { DocumentDetailsModal } from '../components/modals/DocumentDetailsModal'
import type { Source } from '../types/source'
import { PDFViewer } from '../components/PDFViewer'
import { MarkdownViewer } from '../components/MarkdownViewer'
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

  // Custom hooks
  const { sources: chatbotSources, refetch: refetchSources, error: notebookSourcesError } = useNotebookSources(notebookId)
  const { messages: chatMessages, sending: chatLoading, sendMessage } = useChatHistory(notebookId)
  const { sources: publicSources, loading: publicSourcesLoading, error: publicSourcesError } = usePublicSources()

  const { deleteSource, addPublicSource } = useNotebookActions(notebookId)

  // UI state only
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [viewingPdf, setViewingPdf] = useState<Source | null>(null)
  const [viewingMarkdown, setViewingMarkdown] = useState<Source | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [sourceFilter, setSourceFilter] = useState<'all' | 'uploaded' | 'repository'>('all')
  const [activeTab, setActiveTab] = useState<'chat' | 'sources' | 'studio'>('chat')
  const [notebook, setNotebook] = useState<Notebook | null>(null)
  const [loading, setLoading] = useState(true)
  const combinedError = notebookSourcesError || publicSourcesError

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

  const handleViewSource = (source: Source) => {
    if (source.type === 'pdf') {
      setViewingPdf(source)
    } else if (source.type === 'md' || source.type === 'txt') {
      setViewingMarkdown(source)
    }
  }

  const handleDownload = async (source: Source) => {
    try {
      const response = await fetch(source.url)
      if (!response.ok) throw new Error('Network response was not ok')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = source.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      window.open(source.url, '_blank')
    }
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
          publicSources={publicSources}
          publicSourcesLoading={publicSourcesLoading}
          publicSourcesError={publicSourcesError}
          sourceFilter={sourceFilter}
          notebookId={notebookId}
          onShowUploadModal={() => setShowUploadModal(true)}
          onSelectSource={setSelectedSource}
          onViewSource={handleViewSource}
          onDeleteSource={deleteSource}
          onAddPublicSourceToWorkspace={addPublicSource}
          onRefetchSources={refetchSources}
          setSourceFilter={setSourceFilter}
        />

        <div className="flex flex-1 min-h-0">
          <ChatArea
            activeTab={activeTab}
            chatMessages={chatMessages}
            chatLoading={chatLoading}
            publicSourcesError={combinedError}
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

      {viewingPdf && (
        <PDFViewer 
          pdfUrl={viewingPdf.url}
          pdfName={viewingPdf.name}
          onClose={() => setViewingPdf(null)}
        />
      )}

      {viewingMarkdown && (
        <MarkdownViewer
          url={viewingMarkdown.url}
          name={viewingMarkdown.name}
          onClose={() => setViewingMarkdown(null)}
        />
      )}

      <DocumentDetailsModal
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
        onDownload={handleDownload}
        onDelete={(source) => {
          deleteSource(source.id)
          setSelectedSource(null)
        }}
      />
    </div>
  )
}