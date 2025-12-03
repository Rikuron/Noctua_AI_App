import { useState, useEffect } from 'react'
import { Sparkles, Clock, FileText, Loader2, Copy, FileCode, FileImage, Trash2 } from 'lucide-react'
import { formatDateTime } from '../../utils/formatters'
import { generateAndSaveSummary, getNotebookSummaries, deleteSummary } from '../../lib/firestore/summaries'
import { getNotebookSources } from '../../lib/firestore/sources'
import type { Source } from '../../types/source'
import type { Summary } from '../../types/summary'
import { Modal } from './Modal'
import { ErrorMessage } from '../ui/ErrorMessage'
import { MarkdownContent } from '../ui/MarkdownContent'
import { AppLoader } from '../ui/AppLoader'
import { downloadUtils } from '../../utils/download'
import removeMarkdown from 'remove-markdown'

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
  const [downloadingFormat, setDownloadingFormat] = useState<'txt' | 'md' | 'pdf' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'generate' | 'view'>('list')

  useEffect(() => {
    if (isOpen) loadData()
  }, [isOpen, notebookId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccessMessage(null)

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
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSummary = async () => {
    if (selectedSourceIds.length === 0) {
      setError('Please select at least one source to generate a summary.')
      return
    }

    try {
      setGenerating(true)
      setError(null)
      setSuccessMessage(null)

      const summaryId = await generateAndSaveSummary(notebookId, selectedSourceIds)

      // Reload summaries to get the new summary
      const updatedSummaries = await getNotebookSummaries(notebookId)
      setSummaries(updatedSummaries)

      // Show the newly created summary
      const newSummary = updatedSummaries.find(s => s.id === summaryId)
      if (newSummary) {
        setCurrentSummary(newSummary)
        setView('view')
        setSuccessMessage('Summary generated successfully!')
      }
    } catch (err: any) {
      console.error('Error generating summary: ', err)
      const errorMsg = err.message || 'Unknown error'
      setError(`Failed to generate summary: ${errorMsg}`)
    } finally {
      setGenerating(false)
    }
  }

  const toggleSourceSelection = (sourceId: string) => {
    setSelectedSourceIds(prev =>
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    )
  }

  const handleDownload = async (format: 'txt' | 'md' | 'pdf') => {
    if (!currentSummary) return

    try {
      setDownloadingFormat(format)
      setError(null)
      setSuccessMessage(null)

      const filename = `summary-${currentSummary.id.slice(0, 8)}-${Date.now()}`
      const sourceNames = currentSummary.sourceNames || []
      const generatedAt = currentSummary.generatedAt

      switch (format) {
        case 'txt':
          downloadUtils.txt(currentSummary.content, filename)
          setSuccessMessage('TXT file downloaded successfully!')
          break
        case 'md':
          downloadUtils.md(currentSummary.content, filename)
          setSuccessMessage('Markdown file downloaded successfully!')
          break
        case 'pdf':
          await downloadUtils.pdf(
            currentSummary.content,
            filename,
            sourceNames,
            generatedAt,
            'AI Summary' // Use a default name
          )
          setSuccessMessage('PDF downloaded successfully!')
          break
      }
    } catch (err: any) {
      console.error(`Error downloading ${format}:`, err)
      setError(`Failed to download ${format.toUpperCase()}: ${err.message}`)
    } finally {
      setDownloadingFormat(null)
    }
  }

  const handleCopyToClipboard = async () => {
    if (!currentSummary) return

    try {
      // Convert markdown to plain text before copying
      const plainText = removeMarkdown(currentSummary.content, {
        stripListLeaders: true,
        listUnicodeChar: '•',
        gfm: true,
        useImgAltText: true,
      })

      await navigator.clipboard.writeText(plainText)
      setSuccessMessage('Summary copied to clipboard!')
    } catch (err) {
      console.error('Error copying to clipboard:', err)
      setError('Failed to copy to clipboard')
    }
  }

  const handleDelete = async (summaryId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()

    if (!confirm('Are you sure you want to delete this summary? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(summaryId)
      setError(null)
      await deleteSummary(notebookId, summaryId)

      // Remove from local state
      setSummaries(prev => prev.filter(s => s.id !== summaryId))

      // If we're viewing this summary, go back to list
      if (currentSummary?.id === summaryId) {
        setCurrentSummary(null)
        setView('list')
      }

      setSuccessMessage('Summary deleted successfully')
    } catch (err) {
      console.error('Error deleting summary:', err)
      setError('Failed to delete summary')
    } finally {
      setDeletingId(null)
    }
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
            {successMessage && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-800 text-green-400 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

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
                    className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-gray-500 hover:bg-gray-650 cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">{formatDateTime(summary.generatedAt)}</span>
                        </div>
                        <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                          {summary.content.substring(0, 200)}...
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <FileText className="w-3 h-3" />
                          <span>{summary.sourceIds.length} source(s)</span>
                          {summary.sourceNames && summary.sourceNames.length > 0 && (
                            <span>• {summary.sourceNames.slice(0, 2).join(', ')}{summary.sourceNames.length > 2 ? '...' : ''}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDelete(summary.id, e)}
                          disabled={deletingId === summary.id}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete summary"
                        >
                          {deletingId === summary.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                        <Sparkles className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
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
              className="mb-4 text-blue-400 hover:text-blue-300 hover:cursor-pointer text-sm flex items-center gap-1"
            >
              ← Back to summaries
            </button>

            <h3 className="text-lg font-medium mb-4">Generate New Summary</h3>

            {error && <ErrorMessage message={error} />}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-800 text-green-400 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            <p className="text-sm text-gray-400 mb-4">
              Select the sources you want to include in the summary:
            </p>

            {sources.length === 0 ? (
              <div className="text-center py-8 bg-gray-700 rounded-lg">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">No sources available. Upload sources first.</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-500 hover:cursor-pointer text-white rounded-lg transition-colors text-sm"
                >
                  Go to Sources
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-6 max-h-96 overflow-y-auto custom-scrollbar pr-2">
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
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${bgClass} ${borderClass}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSourceIds.includes(source.id)}
                          onChange={() => toggleSourceSelection(source.id)}
                          className={`w-4 h-4 ${isRepo ? 'accent-green-500' : 'accent-blue-600'}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{source.name}</p>
                            {isRepo && (
                              <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full border border-green-500/30 whitespace-nowrap">
                                Repository
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>

                <div className="flex gap-3 mb-6 flex-wrap">
                  <button
                    onClick={() => setSelectedSourceIds(sources.map(s => s.id))}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 hover:cursor-pointer text-white rounded-lg transition-colors text-sm"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedSourceIds([])}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 hover:cursor-pointer text-white rounded-lg transition-colors text-sm"
                  >
                    Deselect All
                  </button>
                  <div className="ml-auto text-sm text-gray-400">
                    {selectedSourceIds.length} source{selectedSourceIds.length !== 1 ? 's' : ''} selected
                  </div>
                </div>

                <button
                  onClick={handleGenerateSummary}
                  disabled={generating || selectedSourceIds.length === 0}
                  className="w-full py-3 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Summary...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Summary from {selectedSourceIds.length} source{selectedSourceIds.length !== 1 ? 's' : ''}
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
              className="mb-4 text-blue-400 hover:text-blue-300 hover:cursor-pointer text-sm flex items-center gap-1"
            >
              ← Back to summaries
            </button>

            {error && <ErrorMessage message={error} />}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-800 text-green-400 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            {currentSummary && (
              <div>
                {/* Header with metadata and download buttons */}
                <div className="bg-linear-to-r from-gray-800 to-gray-900 rounded-lg p-5 mb-6 border border-gray-700">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                        <Clock className="w-4 h-4" />
                        <span>{formatDateTime(currentSummary.generatedAt)}</span>
                        <span className="mx-2">•</span>
                        <FileText className="w-4 h-4" />
                        <span>{currentSummary.sourceIds.length} source{currentSummary.sourceIds.length !== 1 ? 's' : ''} used</span>
                      </div>

                      {currentSummary.sourceNames && currentSummary.sourceNames.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {currentSummary.sourceNames.map((name, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md border border-gray-600"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Download Buttons - Fixed loading states */}
                    <div className="flex flex-wrap gap-2 lg:flex-nowrap">
                      <button
                        onClick={handleCopyToClipboard}
                        disabled={downloadingFormat !== null}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                        <span className="hidden sm:inline">Copy</span>
                      </button>

                      <button
                        onClick={() => handleDownload('txt')}
                        disabled={downloadingFormat !== null}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
                        title="Download as TXT"
                      >
                        {downloadingFormat === 'txt' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">TXT</span>
                      </button>

                      <button
                        onClick={() => handleDownload('md')}
                        disabled={downloadingFormat !== null}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
                        title="Download as Markdown"
                      >
                        {downloadingFormat === 'md' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileCode className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">MD</span>
                      </button>

                      <button
                        onClick={() => handleDownload('pdf')}
                        disabled={downloadingFormat !== null}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
                        title="Download as PDF"
                      >
                        {downloadingFormat === 'pdf' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileImage className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">PDF</span>
                      </button>

                      <div className="w-px h-8 bg-gray-700 mx-1 hidden lg:block" />

                      <button
                        onClick={() => currentSummary && handleDelete(currentSummary.id)}
                        disabled={deletingId === currentSummary?.id}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-red-900/30 text-gray-300 hover:text-red-400 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors text-sm border border-transparent hover:border-red-900/50"
                        title="Delete summary"
                      >
                        {deletingId === currentSummary?.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Summary Content */}
                <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                  <MarkdownContent content={currentSummary.content} />
                </div>

                {/* Download reminder */}
                <div className="mt-6 text-center text-sm text-gray-400">
                  <p>Don't forget to download your summary for offline use!</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
