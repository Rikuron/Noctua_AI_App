import { useState, useEffect } from 'react'
import { Sparkles, Clock, FileText, Loader2 } from 'lucide-react'
import { formatDateTime } from '../../formatters'
import { generateAndSaveSummary, getNotebookSummaries } from '../../lib/firestore/summaries'
import { getNotebookSources } from '../../lib/firestore/sources'
import type { Source } from '../../types/source'
import type { Summary } from '../../types/summary'
import { Modal } from './Modal'
import { ErrorMessage } from '../ui/ErrorMessage'
import { MarkdownContent } from '../ui/MarkdownContent'
import { AppLoader } from '../ui/AppLoader'

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

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Summaries"
      subtitle="AI-generated summaries from your sources"
      icon={<Sparkles className="w-5 h-5 text-white" />}
      size="lg"
    >
      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-6">
        {loading ? (
          <AppLoader size="sm" label="Loading summaries..." />
        ) : view === 'list' ? (
          // List View
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Your Summaries ({summaries.length})</h3>
              <button
                onClick={() => setView('generate')}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white rounded-lg transition-colors text-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span className="sm:hidden">New</span>
                <span className="hidden sm:inline">Generate New Summary</span>
              </button>
            </div>

            {error && <ErrorMessage message={error} />}

            {summaries.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">No summaries yet</h3>
                <p className="text-gray-400 mb-6">Generate your first AI summary from your sources</p>
                <button
                  onClick={() => setView('generate')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white rounded-lg transition-colors text-sm"
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
                          <span className="text-sm text-gray-400">{formatDateTime(summary.generatedAt)}</span>
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
              className="mb-4 text-blue-400 hover:text-blue-300 hover:cursor-pointer text-sm"
            >
              ← Back to summaries
            </button>

            <h3 className="text-lg font-medium mb-4">Generate New Summary</h3>

            {error && <ErrorMessage message={error} />}

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
                  {sources.map(source => {
                    const isRepo = source.fromRepository
                    const isSelected = selectedSourceIds.includes(source.id)

                    let borderClass = 'border-gray-600 hover:border-gray-500'
                    let bgClass = 'bg-gray-700'

                    if (isSelected) {
                      if (isRepo) {
                        borderClass = 'border-green-500'
                        bgClass = 'bg-green-600/20'
                      } else {
                        borderClass = 'border-blue-500'
                        bgClass = 'bg-blue-600/20'
                      }
                    }

                    return (
                      <label
                        key={source.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${bgClass} ${borderClass}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSourceIds.includes(source.id)}
                          onChange={() => toggleSourceSelection(source.id)}
                          className={`w-4 h-4 ${isRepo ? 'accent-green-500' : 'accent-blue-600'}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{source.name}</p>
                            {isRepo && (
                              <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full border border-green-500/30">
                                Repository
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>

                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => setSelectedSourceIds(sources.map(s => s.id))}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 hover:cursor-pointer text-white rounded-lg transition-colors text-sm"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedSourceIds([])}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                  >
                    Deselect All
                  </button>
                </div>

                <button
                  onClick={handleGenerateSummary}
                  disabled={generating || selectedSourceIds.length === 0}
                  className="w-full py-2 bg-blue-600 cursor-pointer hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Summary...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
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
              className="mb-4 text-blue-400 hover:text-blue-300 hover:cursor-pointer text-sm"
            >
              ← Back to summaries
            </button>

            {currentSummary && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatDateTime(currentSummary.generatedAt)}</span>
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
                  <MarkdownContent content={currentSummary.content} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}