import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../components/authProvider'
import { UploadSourcesModal } from '../components/uploadSourcesModal'
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
  HelpCircle
} from 'lucide-react'

export const Route = createFileRoute('/notebook/$notebookId')({
  component: NotebookDetail,
})

function NotebookDetail() {
  // Track selected sources for chatbot
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const { notebookId } = Route.useParams()
  const [chatbotSources, setChatbotSources] = useState<any[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)

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
      } catch {
        setChatbotSources([])
      }
    }
    
    fetchNotebookSources()
  }, [notebookId, showUploadModal])
        
  // Chat state
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [savingName, setSavingName] = useState(false)
  
  // Utility to format file size
  function formatFileSize(bytes: number) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Byte'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }
  
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
        // Dynamically import usePDFs hook logic
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
          // If notebook not found, create a fallback for new notebooks
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
        // Create fallback notebook even if there's an error
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
      <header className="border-b border-gray-700 px-6 py-4 bg-gray-900">
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
                    className="flex items-center gap-2"
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
          
          <div className="flex items-center gap-3">
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
              <span className="text-sm font-medium">U</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-81px)]">
        {/* Left Sidebar - Sources */}
        <div className="w-80 border-r border-gray-700 flex flex-col bg-gray-900">
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
            {/* Chatbot Sources Section */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Chatbot Sources</h3>
              <div className="custom-scrollbar" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {chatbotSources.length === 0 ? (
                  <div className="text-xs text-gray-400">No sources referenced for chatbot.</div>
                ) : (
                  <ul className="space-y-2">
                    {chatbotSources.map(source => (
                      <li key={source.id} className="bg-gray-800 rounded-lg p-2 flex items-center justify-between border border-gray-700">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedSourceIds.includes(source.id)}
                            onChange={e => {
                              setSelectedSourceIds(ids =>
                                e.target.checked
                                  ? [...ids, source.id]
                                  : ids.filter(id => id !== source.id)
                              )
                            }}
                            className="mr-2"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm truncate">{source.name}</span>
                            <span className="text-xs text-gray-400">{formatFileSize(source.size)} • {new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(source.uploadedAt)}</span>
                            {source.fromRepository && (
                              <span className="text-xs text-blue-400">Referenced from Material Repository</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-xs">View</a>
                          <button
                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                            onClick={async () => {
                              // Delete source from notebook
                              try {
                                const { db } = await import('../firebase')
                                const { doc, deleteDoc } = await import('firebase/firestore')
                                await deleteDoc(doc(db, 'notebooks/' + notebookId + '/sources', source.id))
                                setChatbotSources(chatbotSources.filter(s => s.id !== source.id))
                                setSelectedSourceIds(selectedSourceIds.filter(id => id !== source.id))
                              } catch (err: any) {
                                alert('Failed to delete source: ' + (err?.message || String(err)))
                              }
                            }}
                          >Delete</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {/* Material Repository PDFs Section (view only, no add) */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Globe className="w-4 h-4" /> Material Repository PDFs</h3>
              <div className="custom-scrollbar" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {pdfsLoading ? (
                  <div className="text-xs text-gray-400">Loading PDFs...</div>
                ) : pdfsError ? (
                  <div className="text-xs text-red-400">{pdfsError}</div>
                ) : globalPdfs.length === 0 ? (
                  <div className="text-xs text-gray-400">No PDFs found in repository.</div>
                ) : (
                  <ul className="space-y-2">
                    {globalPdfs.map(pdf => (
                      <li key={pdf.id} className="bg-gray-800 rounded-lg p-2 flex items-center justify-between border border-gray-700">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm truncate">{pdf.name}</span>
                          <span className="text-xs text-gray-400">{formatFileSize(pdf.size)} • {new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(pdf.uploadedAt)}</span>
                        </div>
                        <div className="flex gap-2">
                          <a href={pdf.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-xs">View</a>
                          <button
                            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                            onClick={async () => {
                              // Add PDF as source to notebook (reference only)
                              try {
                                const { db } = await import('../firebase')
                                const { collection: fsCollection, addDoc, getDocs } = await import('firebase/firestore')
                                const sourcesRef = fsCollection(db, 'notebooks/' + notebookId + '/sources')
                                await addDoc(sourcesRef, {
                                  name: pdf.name,
                                  url: pdf.url,
                                  size: pdf.size,
                                  uploadedAt: pdf.uploadedAt,
                                  type: 'pdf',
                                  extractedText: '',
                                  fromRepository: true
                                })
                                alert('PDF added to Chatbot Sources!')
                                // Optionally refresh chatbotSources
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
                              } catch (err: any) {
                                alert('Failed to add PDF: ' + (err?.message || String(err)))
                              }
                            }}
                          >Add to Chatbot Sources</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

        
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-gray-900">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Chat</span>
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <div className="ml-auto flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-gray-400" />
                <button className="text-gray-400 hover:text-white text-sm">⋮</button>
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="flex flex-col w-full h-full">
                <div className="mb-4 bg-gray-800 rounded-lg p-4" style={{ height: '500px', overflowY: 'auto' }}>
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-400">Start chatting with your notebook sources!</div>
                  ) : (
                    <ul className="space-y-3">
                      {chatMessages.map((msg, idx) => (
                        <li key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`px-4 py-2 rounded-lg max-w-[80%] wrap-break-word ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}`}>{msg.text}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <form
                  className="flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!chatInput.trim()) return
                    setChatMessages(msgs => [...msgs, { role: 'user', text: chatInput }])
                    setChatLoading(true)
                    try {
                      // Call Gemini API or mock response
                      let botReply = ''
                      try {
                        const { chatWithSources } = await import('../lib/gemini')
                        botReply = await chatWithSources(chatInput, [], [])
                      } catch {
                        botReply = "(Gemini API not configured) This is a mock response to: " + chatInput
                      }
                      setChatMessages(msgs => [...msgs, { role: 'bot', text: botReply }])
                    } finally {
                      setChatLoading(false)
                      setChatInput('')
                    }
                  }}
                >
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-600 bg-gray-900 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Type your message..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    disabled={chatLoading}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={chatLoading || !chatInput.trim()}
                  >Send</button>
                </form>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Studio */}
          <div className="w-80 border-l border-gray-700 bg-gray-900 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Studio</span>
                <div className="w-6 h-6 bg-gray-800 rounded border border-gray-600 ml-auto"></div>
              </div>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              
              <StudioCard 
                icon={<Brain className="w-5 h-5" />}
                title="Summary"
                description=""
              />
              
              <StudioCard 
                icon={<BarChart3 className="w-5 h-5" />}
                title="Presentations"
                description=""
              />
              
              <StudioCard 
                icon={<StickyNote className="w-5 h-5" />}
                title="Flashcards"
                description=""
              />
              
              <StudioCard 
                icon={<HelpCircle className="w-5 h-5" />}
                title="Quiz"
                description=""
              />
            </div>

            {/* Fixed position button at bottom of sidebar */}
            <div className="p-4 border-t border-gray-700">
              <button className="w-full h-12 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg">
                <StickyNote className="w-5 h-5 text-white mr-2" />
                <span className="text-white font-medium">New Note</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upload Sources Modal */}
      <UploadSourcesModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={(sources) => {
          console.log('Sources uploaded:', sources)
          setShowUploadModal(false)
        }}
      />
    </div>
  )
}

function StudioCard({ 
  icon, 
  title, 
  description, 
  subtitle 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors cursor-pointer border border-gray-700">
      <div className="flex items-start gap-3">
        <div className="text-gray-400 mt-0.5">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm mb-1">{title}</h4>
          {description && (
            <p className="text-xs text-gray-400">{description}</p>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">{subtitle}</p>
          )}
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
