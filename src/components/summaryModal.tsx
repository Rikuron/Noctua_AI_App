import { useState, useEffect } from 'react'
import { X, Sparkles, Clock, FileText, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CustomScrollbarStyles } from './CustomScrollbar'
import { generateAndSaveSummary, getNotebookSummaries } from '../lib/firestore/summaries'
import { getNotebookSources } from '../lib/firestore/sources'
import type { Source } from '../types/source'
import type { Summary } from '../types/summary'

interface SummaryModalProps {
  isOpen: boolean
  onClose: () => void
  notebookId: string
}

export function SummaryModal({ isOpen, onClose, notebookId }: SummaryModalProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [currentSummary, setCurrentSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'generate' | 'view'>('list')

  useEffect(() => {
    if (isOpen) loadData()
  }, [isOpen, notebookId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [sourcesData, summariesData] = await Promise.all([
        getNotebookSources(notebookId),
        getNotebookSummaries(notebookId)
      ])

      setSources(sourcesData)
      setSummaries(summariesData)

      // Select all sources by default
      setSelectedSourceIds(sourcesData.map(s => s.id))
    } catch (err: any) {
      console.error('Error loading data: ', err)
      setError('Failed to load summaries. Please try again.')
    } finally { setLoading(false) }
  }

  const handleGenerateSummary = async () => {
    if (selectedSourceIds.length === 0) {
      setError('Please select at least one source to generate a summary.')
      return
    }

    try {
      setGenerating(true)
      setError(null)
      const summaryId = await generateAndSaveSummary(notebookId, selectedSourceIds)

      // Reload summaries to get the new summary
      const updatedSummaries = await getNotebookSummaries(notebookId)
      setSummaries(updatedSummaries)

      // Show the newly created summary
      const newSummary = updatedSummaries.find(s => s.id === summaryId)
      if (newSummary) {
        setCurrentSummary(newSummary)
        setView('view')
      }
    } catch (err: any) {
      console.error('Error generating summary: ', err)
      setError(`Failed to generate summary: ${err.message || 'Unknown error'}`)
    } finally { setGenerating(false) }
  }

  const toggleSourceSelection = (sourceId: string) => {
    setSelectedSourceIds(prev => 
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    )
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <CustomScrollbarStyles />
      <div className="bg-gray-800 rounded-2xl w-full max-w-4xl border border-gray-600 max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Summaries</h2>
              <p className="text-sm text-gray-400">AI-generated summaries from your sources</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            disabled={generating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : view === 'list' ? (
            // List View
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">Your Summaries ({summaries.length})</h3>
                <button
                  onClick={() => setView('generate')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate New Summary
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {summaries.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No summaries yet</h3>
                  <p className="text-gray-400 mb-6">Generate your first AI summary from your sources</p>
                  <button
                    onClick={() => setView('generate')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Generate Summary
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {summaries.map(summary => (
                    <div
                      key={summary.id}
                      onClick={() => {
                        setCurrentSummary(summary)
                        setView('view')
                      }}
                      className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">{formatDate(summary.generatedAt)}</span>
                          </div>
                          <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                            {summary.content.substring(0, 150)}...
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <FileText className="w-3 h-3" />
                            <span>{summary.sourceIds.length} source(s)</span>
                            {summary.sourceNames && summary.sourceNames.length > 0 && (
                              <span>• {summary.sourceNames.slice(0, 2).join(', ')}{summary.sourceNames.length > 2 ? '...' : ''}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : view === 'generate' ? (
            // Generate View
            <div>
              <button
                onClick={() => setView('list')}
                className="mb-4 text-blue-400 hover:text-blue-300 text-sm"
              >
                ← Back to summaries
              </button>

              <h3 className="text-lg font-medium mb-4">Generate New Summary</h3>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <p className="text-sm text-gray-400 mb-4">
                Select the sources you want to include in the summary:
              </p>

              {sources.length === 0 ? (
                <div className="text-center py-8 bg-gray-700 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">No sources available. Upload sources first.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                    {sources.map(source => (
                      <label
                        key={source.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedSourceIds.includes(source.id)
                            ? 'bg-blue-600/20 border-blue-500'
                            : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSourceIds.includes(source.id)}
                          onChange={() => toggleSourceSelection(source.id)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{source.name}</p>
                          <p className="text-xs text-gray-400">
                            {source.extractedText && source.extractedText !== 'Failed to extract text from PDF. Please try again.' ? 
                              `${source.extractedText.length} characters` : 
                              'No text extracted'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => setSelectedSourceIds(sources.map(s => s.id))}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedSourceIds([])}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                    >
                      Deselect All
                    </button>
                  </div>

                  <button
                    onClick={handleGenerateSummary}
                    disabled={generating || selectedSourceIds.length === 0}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Summary...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Summary ({selectedSourceIds.length} source{selectedSourceIds.length !== 1 ? 's' : ''})
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          ) : (
            // View Summary
            <div>
              <button
                onClick={() => {
                  setCurrentSummary(null)
                  setView('list')
                }}
                className="mb-4 text-blue-400 hover:text-blue-300 text-sm"
              >
                ← Back to summaries
              </button>

              {currentSummary && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(currentSummary.generatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <FileText className="w-4 h-4" />
                        <span>{currentSummary.sourceIds.length} source(s) used</span>
                        {currentSummary.sourceNames && currentSummary.sourceNames.length > 0 && (
                          <span className="text-xs">• {currentSummary.sourceNames.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                    <div className="prose prose-invert max-w-none markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mb-4" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-xl font-bold text-white mb-3 mt-6" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-white mb-2 mt-4" {...props} />,
                          p: ({node, ...props}) => <p className="text-gray-200 mb-3 leading-relaxed" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside text-gray-200 mb-3 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside text-gray-200 mb-3 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="text-gray-200 ml-4" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
                          code: ({node, ...props}) => <code className="bg-gray-800 px-2 py-1 rounded text-blue-300 text-sm" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300 my-3" {...props} />,
                          table: ({node, ...props}) => (
                            <div className="overflow-x-auto my-4">
                              <table className="min-w-full border-2 border-gray-500" {...props} />
                            </div>
                          ),
                          thead: ({node, ...props}) => <thead className="bg-gray-600" {...props} />,
                          tbody: ({node, ...props}) => <tbody {...props} />,
                          tr: ({node, ...props}) => <tr className="border-b-2 border-gray-500" {...props} />,
                          th: ({node, ...props}) => <th className="border-2 border-gray-500 px-4 py-2 text-left font-semibold text-white bg-gray-700" {...props} />,
                          td: ({node, ...props}) => <td className="border-2 border-gray-500 px-4 py-2 text-gray-200" {...props} />,
                        }}
                      >
                        {currentSummary.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}