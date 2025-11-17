import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../components/authProvider'
import { UploadSourcesModal } from '../components/uploadSourcesModal'
import { SummaryModal } from '../components/summaryModal'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CustomScrollbarStyles } from '../components/CustomScrollbar'
import { getNotebook } from '../lib/firestore/notebook'
import type { Notebook } from '../types/notebook'
import { 
  ArrowLeft, 
  Plus, 
  Globe, 
  Settings,
  Share,
  MessageCircle,
  Grid3X3,
  BarChart3,
  Brain,
  StickyNote,
  HelpCircle,
  Search,
  X,
  Download,
  FileText,
  Check,
  Sparkles,
  MoreVertical
} from 'lucide-react'

export const Route = createFileRoute('/notebook/$notebookId')({
  component: NotebookDetail,
})

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

function NotebookDetail() {
  // Track active sources for chatbot
  const [activeSourceIds, setActiveSourceIds] = useState<string[]>([])
  const { notebookId } = Route.useParams()
  const [chatbotSources, setChatbotSources] = useState<any[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [materialSearchQuery, setMaterialSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'uploaded' | 'repository'>('all')
  const [activeTab, setActiveTab] = useState<'chat' | 'sources' | 'studio'>('chat')

  useEffect(() => {
    async function fetchNotebookSources() {
      try {
        const { db } = await import('../firebase')
        const { collection, getDocs } = await import('firebase/firestore')
        if (!db || !notebookId) return
        const sourcesRef = collection(db, 'notebooks/' + notebookId + '/sources')
        const querySnapshot = await getDocs(sourcesRef)
        const sourcesList: any[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          sourcesList.push({
            id: doc.id,
            name: data.name,
            url: data.url,
            size: data.size,
            uploadedAt: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(),
            type: data.type,
            fromRepository: !!data.fromRepository
          })
        })
        setChatbotSources(sourcesList)
        // Auto-activate all sources by default
        setActiveSourceIds(sourcesList.map(source => source.id))
      } catch {
        setChatbotSources([])
      }
    }
    
    fetchNotebookSources()
  }, [notebookId, showUploadModal])
        
  // Chat state
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    async function loadChatHistory() {
      if (!notebookId) return

      try {
        const { getOrCreateChat, getChatMessages } = await import('../lib/firestore/chats')
        const chatId = await getOrCreateChat(notebookId)
        setCurrentChatId(chatId)

        const messages = await getChatMessages(notebookId, chatId)
        // Convert ChatMessage format to local format
        const formattedMessages = messages.map(msg => ({
          role: msg.role === 'assistant' ? 'bot' as const : msg.role,
          text: msg.content,
        }))
        setChatMessages(formattedMessages)
      } catch (error) {
        console.error('Error loading chat history:', error)
      }
    }

    loadChatHistory()
  }, [notebookId])
  
  const navigate = useNavigate()
  const { user } = useAuth()
  const [notebook, setNotebook] = useState<Notebook | null>(null)
  const [loading, setLoading] = useState(true)
  const [globalPdfs, setGlobalPdfs] = useState<any[]>([])
  const [pdfsLoading, setPdfsLoading] = useState(true)
  const [pdfsError, setPdfsError] = useState<string | null>(null)

  // Fetch global PDFs from material repository
  useEffect(() => {
    async function fetchGlobalPdfs() {
      try {
        setPdfsLoading(true)
        setPdfsError(null)
        const { db } = await import('../firebase')
        const { collection, getDocs } = await import('firebase/firestore')
        if (!db) throw new Error('Firebase not initialized')
        const pdfsRef = collection(db, 'pdfs')
        const querySnapshot = await getDocs(pdfsRef)
        const pdfList: any[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          pdfList.push({
            id: doc.id,
            name: data.name,
            url: data.url,
            size: data.size,
            uploadedAt: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(),
            type: data.type
          })
        })
        setGlobalPdfs(pdfList.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()))
      } catch (err: any) {
        setPdfsError('Failed to fetch PDFs')
        setGlobalPdfs([])
      } finally {
        setPdfsLoading(false)
      }
    }
    fetchGlobalPdfs()
  }, [])

  useEffect(() => {
    async function loadNotebook() {
      if (!user) return
      
      try {
        const notebookData = await getNotebook(notebookId)
        if (notebookData) {
          setNotebook(notebookData)
          setNewName(notebookData.name)
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
          setNewName('New Workspace')
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

  // Filter material repository PDFs based on search
  const filteredMaterialPdfs = globalPdfs.filter(pdf =>
    pdf.name.toLowerCase().includes(materialSearchQuery.toLowerCase())
  )

  // Filter chatbot sources based on active filter
  const filteredChatbotSources = chatbotSources.filter(source => {
    if (sourceFilter === 'all') return true
    if (sourceFilter === 'uploaded') return !source.fromRepository
    if (sourceFilter === 'repository') return source.fromRepository
    return true
  })

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
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading notebook...</div>
      </div>
    )
  }

  if (!notebook) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Notebook not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <CustomScrollbarStyles />
      
      {/* Header */}
      <header className="border-b border-gray-700 px-4 lg:px-6 py-4 bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: '/' })}
              className="p-1 hover:bg-gray-700 rounded-md transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                {editingName ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      if (!notebook) return
                      setSavingName(true)
                      try {
                        const { updateNotebook } = await import('../lib/firestore/notebook')
                        await updateNotebook(notebook.id, { name: newName })
                        setNotebook({ ...notebook, name: newName })
                        setEditingName(false)
                      } catch (err) {
                        alert('Failed to update notebook name')
                      } finally {
                        setSavingName(false)
                      }
                    }}
                    className="flex items-center gap-2 flex-wrap"
                  >
                    <input
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-lg text-white font-semibold focus:outline-none focus:border-blue-500"
                      disabled={savingName}
                      maxLength={64}
                      style={{ minWidth: '120px' }}
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        disabled={savingName || !newName.trim()}
                      >Save</button>
                      <button
                        type="button"
                        className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                        onClick={() => { setEditingName(false); setNewName(notebook.name) }}
                        disabled={savingName}
                      >Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="font-semibold text-lg">{notebook.name}</h1>
                    <button
                      className="ml-2 px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-xs"
                      onClick={() => setEditingName(true)}
                    >Edit</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Desktop buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Create notebook
            </button>
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Share className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Grid3X3 className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">{getUserInitial()}</span>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="lg:hidden flex border-b border-gray-700 bg-gray-900">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'chat' 
              ? 'border-blue-500 text-blue-500' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Chat
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('sources')}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'sources' 
              ? 'border-blue-500 text-blue-500' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            Sources
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('studio')}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'studio' 
              ? 'border-blue-500 text-blue-500' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Studio
          </div>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-81px)] lg:h-[calc(100vh-81px)]">
        {/* Left Sidebar - Sources - Hidden on mobile when chat/studio is active */}
        <div className={`${
          activeTab === 'sources' ? 'flex' : 'hidden'
        } lg:flex w-full lg:w-80 border-r border-gray-700 flex-col bg-gray-900`}>
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Sources</h2>
              <div className="w-6 h-6 bg-gray-800 rounded border border-gray-600 flex items-center justify-center">
                <span className="text-xs">📁</span>
              </div>
            </div>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add sources
            </button>

            {/* Source Filter - Mobile & Desktop */}
            <div className="flex gap-1 p-1 bg-gray-800 rounded-lg mt-4">
              {(['all', 'uploaded', 'repository'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSourceFilter(filter)}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    sourceFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'uploaded' ? 'Uploaded' : 'Repo'}
                </button>
              ))}
            </div>

            {/* Active Sources Status */}
            <div className="flex items-center justify-between mt-4 px-2">
              <span className="text-sm text-gray-400">Active for chat</span>
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                {activeSourceIds.length} / {chatbotSources.length}
              </span>
            </div>
          </div>

          {/* Sources List */}
          <div className="flex-1 overflow-y-auto">
            {/* Chatbot Sources */}
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-400" />
                <span>Workspace Sources</span>
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                  {filteredChatbotSources.length}
                </span>
              </h3>
              
              {filteredChatbotSources.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-4">
                  No sources added yet
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredChatbotSources.map(source => (
                    <SourceCard
                      key={source.id}
                      source={source}
                      isActive={activeSourceIds.includes(source.id)}
                      onToggle={() => {
                        setActiveSourceIds(ids =>
                          ids.includes(source.id)
                            ? ids.filter(id => id !== source.id)
                            : [...ids, source.id]
                        )
                      }}
                      onDelete={async () => {
                        try {
                          const { db } = await import('../firebase')
                          const { doc, deleteDoc } = await import('firebase/firestore')
                          await deleteDoc(doc(db, 'notebooks/' + notebookId + '/sources', source.id))
                          setChatbotSources(chatbotSources.filter(s => s.id !== source.id))
                          setActiveSourceIds(activeSourceIds.filter(id => id !== source.id))
                        } catch (err: any) {
                          alert('Failed to delete source: ' + (err?.message || String(err)))
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Material Repository Section */}
            <div className="border-t border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-green-400" />
                  <span>Material Repository</span>
                </h3>
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                  {filteredMaterialPdfs.length}
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={materialSearchQuery}
                  onChange={(e) => setMaterialSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                {materialSearchQuery && (
                  <button
                    onClick={() => setMaterialSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Material PDFs List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pdfsLoading ? (
                  <div className="text-xs text-gray-400 text-center py-4">Loading PDFs...</div>
                ) : pdfsError ? (
                  <div className="text-xs text-red-400 text-center py-4">{pdfsError}</div>
                ) : filteredMaterialPdfs.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-4">
                    {materialSearchQuery ? 'No materials found' : 'No materials in repository'}
                  </div>
                ) : (
                  filteredMaterialPdfs.map(pdf => (
                    <MaterialCard
                      key={pdf.id}
                      pdf={pdf}
                      onAddToWorkspace={async () => {
                        try {
                          const { db } = await import('../firebase')
                          const { collection: fsCollection, addDoc, getDocs } = await import('firebase/firestore')

                          let extractedText = ''
                          try {
                            const response = await fetch(pdf.url)
                            const blob = await response.blob()
                            const file = new File([blob], pdf.name, { type: 'application/pdf' })
                            const { extractTextFromPDF } = await import('../lib/pdfExtractor')
                            extractedText = await extractTextFromPDF(file)
                          } catch (extractError) {
                            console.error('Failed to extract text:', extractError)
                            extractedText = 'Failed to extract text from PDF.'
                          }

                          const sourcesRef = fsCollection(db, 'notebooks/' + notebookId + '/sources')
                          await addDoc(sourcesRef, {
                            name: pdf.name,
                            url: pdf.url,
                            size: pdf.size,
                            uploadedAt: pdf.uploadedAt,
                            type: 'pdf',
                            extractedText: extractedText,
                            fromRepository: true
                          })

                          // Refresh chatbotSources
                          const querySnapshot = await getDocs(sourcesRef)
                          const sourcesList: any[] = []
                          querySnapshot.forEach((doc) => {
                            const data = doc.data()
                            sourcesList.push({
                              id: doc.id,
                              name: data.name,
                              url: data.url,
                              size: data.size,
                              uploadedAt: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(),
                              type: data.type,
                              fromRepository: !!data.fromRepository
                            })
                          })
                          setChatbotSources(sourcesList)
                          setActiveSourceIds(prev => [...prev, sourcesList[sourcesList.length - 1].id])

                        } catch (err: any) {
                          alert('Failed to add PDF: ' + (err?.message || String(err)))
                        }
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Chat Area - Full screen coverage */}
          <div className={`${
            activeTab === 'chat' ? 'flex' : 'hidden'
          } lg:flex flex-1 flex-col bg-gray-900`}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Chat</span>
              <div className="flex items-center gap-1 text-xs bg-gray-800 px-2 py-1 rounded-full ml-auto">
                <Sparkles className="w-3 h-3" />
                <span>{activeSourceIds.length} sources active</span>
              </div>
              <div className="hidden lg:flex items-center gap-2 ml-auto">
                <Grid3X3 className="w-4 h-4 text-gray-400" />
                <button className="text-gray-400 hover:text-white text-sm">⋮</button>
              </div>
            </div>
            
            {/* Full screen chat container */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 flex flex-col w-full mx-auto overflow-hidden">
                {/* Full height messages container */}
                <div className="flex-1 bg-gray-800 p-4 overflow-y-auto custom-scrollbar">
                  {chatMessages.length === 0 && !chatLoading ? (
                    <div className="text-center text-gray-400 py-8 h-full flex items-center justify-center">
                      Start chatting with your notebook sources!
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-5xl mx-auto">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'user' ? (
                            <div className="px-4 py-3 rounded-lg max-w-[80%] bg-blue-600 text-white">
                              <div className="whitespace-pre-wrap wrap-break-word">{msg.text}</div>
                            </div>
                          ) : (
                            <div className="px-4 py-3 rounded-lg max-w-[85%] bg-gray-700">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mb-3" {...props} />,
                                  h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mb-2" {...props} />,
                                  h3: ({node, ...props}) => <h3 className="text-base font-semibold text-white mb-2" {...props} />,
                                  p: ({node, ...props}) => <p className="text-gray-100 mb-2 leading-relaxed" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc list-inside text-gray-100 mb-2 space-y-1 ml-2" {...props} />,
                                  ol: ({node, ...props}) => <ol className="list-decimal list-inside text-gray-100 mb-2 space-y-1 ml-2" {...props} />,
                                  li: ({node, ...props}) => <li className="text-gray-100" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                                  em: ({node, ...props}) => <em className="italic text-gray-200" {...props} />,
                                  code: ({node, ...props}) => <code className="bg-gray-800 px-2 py-1 rounded text-blue-300 text-sm" {...props} />,
                                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-3 italic text-gray-200 my-2" {...props} />,
                                  pre: ({node, ...props}) => <pre className="bg-gray-800 p-3 rounded my-2 overflow-x-auto" {...props} />,
                                }}
                              >
                                {msg.text}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Loading indicator */}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="px-4 py-3 rounded-lg bg-gray-700 flex items-center gap-3">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                            <span className="text-gray-400 text-sm">Thinking...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Input form at bottom */}
                <div className="p-4 border-t border-gray-700">
                  <form
                    className="flex gap-2 max-w-5xl mx-auto"
                    onSubmit={async (e) => {
                      e.preventDefault()
                      if (!chatInput.trim()) return

                      const userMessage = chatInput
                      setChatMessages(msgs => [...msgs, { role: 'user', text: userMessage }])
                      setChatInput('')
                      setChatLoading(true)

                      try {
                        // Save user message to database
                        if (currentChatId) {
                          const { addChatMessage } = await import('../lib/firestore/chats')
                          await addChatMessage(notebookId, currentChatId, {
                            role: 'user',
                            content: userMessage,
                          })
                        }

                        // Fetch all notebook sources and their extracted text
                        const { getNotebookSources } = await import('../lib/firestore/sources')
                        const sources = await getNotebookSources(notebookId)

                        // Filter sources based on active sources
                        const activeSources = sources.filter(source => activeSourceIds.includes(source.id))
                        const sourceTexts = activeSources
                          .map(s => s.extractedText)
                          .filter(text => text && text !== 'Failed to extract text from PDF. Please try again.')

                        // Call Gemini API with source content
                        let botReply = ''
                        try {
                          const { chatWithSources } = await import('../lib/gemini')
                          botReply = await chatWithSources(userMessage, sourceTexts, [])
                        } catch (err: any) {
                          console.error('Gemini API error:', err)
                          botReply = 'Failed to answer your question. Please try again.'
                        }

                        setChatMessages(msgs => [...msgs, { role: 'bot', text: botReply }])

                        // Save bot messages to database
                        if (currentChatId) {
                          const { addChatMessage } = await import('../lib/firestore/chats')
                          await addChatMessage(notebookId, currentChatId, {
                            role: 'assistant',
                            content: botReply,
                          })
                        }
                      } catch (err: any) {
                        console.error('Error in chat:', err)
                        setChatMessages(msgs => [...msgs, { 
                          role: 'bot', 
                          text: 'Sorry, I encountered an error. Please try again.' 
                        }])
                      } finally {
                        setChatLoading(false)
                      }
                    }}
                  >
                    <input
                      type="text"
                      className="flex-1 px-4 py-3 rounded-lg border border-gray-600 bg-gray-900 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Type your message..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      disabled={chatLoading}
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                      disabled={chatLoading || !chatInput.trim()}
                    >
                      {chatLoading ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Studio Area - Hidden on mobile when chat/sources is active */}
          <div className={`${
            activeTab === 'studio' ? 'flex' : 'hidden'
          } lg:flex w-full lg:w-80 border-l border-gray-700 bg-gray-900 flex-col`}>
            <div className="px-4 py-3 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Studio</span>
                <div className="w-6 h-6 bg-gray-800 rounded border border-gray-600 ml-auto"></div>
              </div>
            </div>

            {/* Ultra Compact Studio Content */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Studio Cards - Minimal spacing */}
              <div className="p-3 space-y-2 flex-1">
                <StudioCard 
                  icon={<Brain className="w-4 h-4" />}
                  title="Summary"
                  description="Generate a summary of your sources"
                  onClick={() => setShowSummaryModal(true)}
                />
                
                <StudioCard 
                  icon={<BarChart3 className="w-4 h-4" />}
                  title="Presentations"
                  description="Create presentations from your content"
                />
                
                <StudioCard 
                  icon={<StickyNote className="w-4 h-4" />}
                  title="Flashcards"
                  description="Generate study flashcards"
                />
                
                <StudioCard 
                  icon={<HelpCircle className="w-4 h-4" />}
                  title="Quiz"
                  description="Create quizzes from your material"
                />
              </div>

              {/* Compact New Note Button */}
              <div className="p-3 border-t border-gray-700">
                <button className="w-full py-2 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors text-sm">
                  <StickyNote className="w-4 h-4 text-white mr-2" />
                  <span className="text-white font-medium">New Note</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upload Sources Modal */}
      <UploadSourcesModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        notebookId={notebookId}
        onUpload={(sources) => {
          console.log('Sources uploaded:', sources)
          setShowUploadModal(false)
        }}
      />

      {/* Compact Summary Modal */}
      <SummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        notebookId={notebookId}
      />
    </div>
  )
}

// Source Card Component with Toggle Button (No Checkboxes)
function SourceCard({ source, isActive, onToggle, onDelete }: { 
  source: any; 
  isActive: boolean; 
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`bg-gray-800 rounded-lg p-3 border transition-all duration-200 ${
      isActive 
        ? 'border-blue-500 bg-blue-500/10' 
        : 'border-gray-600 hover:border-gray-500'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Toggle Button instead of checkbox */}
          <button
            onClick={onToggle}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all mt-0.5 shrink-0 ${
              isActive
                ? 'bg-blue-500 border-blue-500'
                : 'bg-gray-700 border-gray-500 hover:border-gray-400'
            }`}
          >
            {isActive && <Check className="w-2.5 h-2.5 text-white" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{source.name}</span>
              {source.fromRepository && (
                <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full border border-green-500/30">
                  Repository
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{formatFileSize(source.size)}</span>
              <span>•</span>
              <span>{formatDate(source.uploadedAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <a href={source.url} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <Download className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Material Card Component
function MaterialCard({ pdf, onAddToWorkspace }: { 
  pdf: any; 
  onAddToWorkspace: () => void;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-600 hover:border-gray-500 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-sm truncate">{pdf.name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{formatFileSize(pdf.size)}</span>
            <span>•</span>
            <span>{formatDate(pdf.uploadedAt)}</span>
          </div>
        </div>
        <button
          onClick={onAddToWorkspace}
          className="ml-2 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>
    </div>
  )
}

function StudioCard({ 
  icon, 
  title, 
  description, 
  subtitle,
  onClick
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-2 hover:bg-gray-700 transition-colors cursor-pointer border border-gray-700"
    >
      <div className="flex items-start gap-2">
        <div className="text-gray-400 mt-0.5">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm mb-0.5">{title}</h4>
          {description && (
            <p className="text-xs text-gray-400">{description}</p>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{subtitle}</p>
          )}
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}