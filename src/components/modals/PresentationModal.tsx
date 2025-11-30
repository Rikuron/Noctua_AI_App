import { useState, useEffect } from 'react'
import { Presentation as PresentationIcon, Clock, FileText, Loader2, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import { formatDateTime } from '../../formatters'
import { generateAndSavePresentation, getNotebookPresentations } from '../../lib/firestore/presentations'
import { getNotebookSources } from '../../lib/firestore/sources'
import type { Source } from '../../types/source'
import type { Presentation } from '../../types/presentation'
import { Modal } from './Modal'
import { ErrorMessage } from '../ui/ErrorMessage'
import { MarkdownContent } from '../ui/MarkdownContent'
import { AppLoader } from '../ui/AppLoader'

interface PresentationModalProps {
  isOpen: boolean
  onClose: () => void
  notebookId: string
}

// Parse markdown content into slides (separated by ---)
function parseSlides(content: string): string[] {
  const slides = content.split(/\n---\n/).map(slide => slide.trim()).filter(slide => slide.length > 0)
  return slides.length > 0 ? slides : [content]
}

export function PresentationModal({ isOpen, onClose, notebookId }: PresentationModalProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [currentPresentation, setCurrentPresentation] = useState<Presentation | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'generate' | 'view'>('list')
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [customTitle, setCustomTitle] = useState('')
  const [isPresenting, setIsPresenting] = useState(false)

  useEffect(() => {
    if (isOpen) loadData()
  }, [isOpen, notebookId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [sourcesData, presentationsData] = await Promise.all([
        getNotebookSources(notebookId),
        getNotebookPresentations(notebookId)
      ])

      setSources(sourcesData)
      setPresentations(presentationsData)

      // Select all sources by default
      setSelectedSourceIds(sourcesData.map(s => s.id))
    } catch (err: any) {
      console.error('Error loading data: ', err)
      setError('Failed to load presentations. Please try again.')
    } finally { setLoading(false) }
  }

  const handleGeneratePresentation = async () => {
    if (selectedSourceIds.length === 0) {
      setError('Please select at least one source to generate a presentation.')
      return
    }

    try {
      setGenerating(true)
      setError(null)
      const presentationId = await generateAndSavePresentation(
        notebookId,
        selectedSourceIds,
        customTitle || undefined
      )

      // Reload presentations to get the new presentation
      const updatedPresentations = await getNotebookPresentations(notebookId)
      setPresentations(updatedPresentations)

      // Show the newly created presentation
      const newPresentation = updatedPresentations.find(p => p.id === presentationId)
      if (newPresentation) {
        setCurrentPresentation(newPresentation)
        setCurrentSlideIndex(0)
        setView('view')
      }
    } catch (err: any) {
      console.error('Error generating presentation: ', err)
      setError(`Failed to generate presentation: ${err.message || 'Unknown error'}`)
    } finally { setGenerating(false) }
  }

  const toggleSourceSelection = (sourceId: string) => {
    setSelectedSourceIds(prev =>
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    )
  }

  const slides = currentPresentation ? parseSlides(currentPresentation.content) : []
  const totalSlides = slides.length

  const handlePreviousSlide = () => {
    setCurrentSlideIndex(prev => Math.max(0, prev - 1))
  }

  const handleNextSlide = () => {
    setCurrentSlideIndex(prev => Math.min(totalSlides - 1, prev + 1))
  }

  // Keyboard navigation
  useEffect(() => {
    if (view !== 'view' || !isOpen) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePreviousSlide()
      if (e.key === 'ArrowRight') handleNextSlide()
      if (e.key === 'Escape' && isPresenting) setIsPresenting(false)
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [view, isOpen, currentSlideIndex, totalSlides, isPresenting])

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Presentations"
      subtitle="AI-generated presentations from your sources"
      icon={<PresentationIcon className="w-5 h-5 text-white" />}
      size="xl"
    >
      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-6">
        {loading ? (
          <AppLoader size="sm" label="Loading presentations..." />
        ) : view === 'list' ? (
          // List View
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Your Presentations ({presentations.length})</h3>
              <button
                onClick={() => setView('generate')}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white rounded-lg transition-colors text-sm"
              >
                <PresentationIcon className="w-4 h-4" />
                <span className="sm:hidden">New</span>
                <span className="hidden sm:inline">Generate New Presentation</span>
              </button>
            </div>

            {error && <ErrorMessage message={error} />}

            {presentations.length === 0 ? (
              <div className="text-center py-12">
                <PresentationIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">No presentations yet</h3>
                <p className="text-gray-400 mb-6">Generate your first AI presentation from your sources</p>
                <button
                  onClick={() => setView('generate')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white rounded-lg transition-colors text-sm"
                >
                  Generate Presentation
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {presentations.map(presentation => (
                  <div
                    key={presentation.id}
                    onClick={() => {
                      setCurrentPresentation(presentation)
                      setCurrentSlideIndex(0)
                      setView('view')
                    }}
                    className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-base font-medium text-white mb-2">{presentation.title}</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">{formatDateTime(presentation.generatedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <FileText className="w-3 h-3" />
                          <span>{presentation.sourceIds.length} source(s)</span>
                          {presentation.sourceNames && presentation.sourceNames.length > 0 && (
                            <span>• {presentation.sourceNames.slice(0, 2).join(', ')}{presentation.sourceNames.length > 2 ? '...' : ''}</span>
                          )}
                          <span>• {parseSlides(presentation.content).length} slides</span>
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
              ← Back to presentations
            </button>

            <h3 className="text-lg font-medium mb-4">Generate New Presentation</h3>

            {error && <ErrorMessage message={error} />}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Presentation Title (optional)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Enter a title for your presentation..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Select the sources you want to include in the presentation:
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
                  onClick={handleGeneratePresentation}
                  disabled={generating || selectedSourceIds.length === 0}
                  className="w-full py-2 bg-blue-600 cursor-pointer hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Presentation...
                    </>
                  ) : (
                    <>
                      <PresentationIcon className="w-4 h-4" />
                      Generate Presentation ({selectedSourceIds.length} source{selectedSourceIds.length !== 1 ? 's' : ''})
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        ) : (
          // View Presentation
          <div className="flex flex-col h-full">
            <button
              onClick={() => {
                setCurrentPresentation(null)
                setCurrentSlideIndex(0)
                setView('list')
                setIsPresenting(false)
              }}
              className="mb-4 text-blue-400 hover:text-blue-300 hover:cursor-pointer text-sm"
            >
              ← Back to presentations
            </button>

            {currentPresentation && (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{currentPresentation.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDateTime(currentPresentation.generatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{currentPresentation.sourceIds.length} source(s) used</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPresenting(!isPresenting)}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    {isPresenting ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Exit Presentation Mode
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Presentation Mode
                      </>
                    )}
                  </button>
                </div>

                {/* Slide Navigation */}
                {!isPresenting && (
                  <div className="flex items-center justify-between mb-4 bg-gray-700 rounded-lg p-2">
                    <button
                      onClick={handlePreviousSlide}
                      disabled={currentSlideIndex === 0}
                      className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded transition-colors flex items-center gap-2 text-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <span className="text-sm text-gray-300">
                      Slide {currentSlideIndex + 1} of {totalSlides}
                    </span>
                    <button
                      onClick={handleNextSlide}
                      disabled={currentSlideIndex === totalSlides - 1}
                      className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded transition-colors flex items-center gap-2 text-sm"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Slide Content */}
                <div className={`flex-1 bg-gray-700 rounded-lg p-6 border border-gray-600 ${isPresenting ? 'min-h-[60vh]' : ''}`}>
                  {slides.length > 0 && (
                    <div className="h-full">
                      <MarkdownContent content={slides[currentSlideIndex]} />
                    </div>
                  )}
                </div>

                {/* Presentation Mode Footer */}
                {isPresenting && (
                  <div className="mt-4 flex items-center justify-center gap-4 bg-gray-700 rounded-lg p-3">
                    <button
                      onClick={handlePreviousSlide}
                      disabled={currentSlideIndex === 0}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-300 font-medium">
                      {currentSlideIndex + 1} / {totalSlides}
                    </span>
                    <button
                      onClick={handleNextSlide}
                      disabled={currentSlideIndex === totalSlides - 1}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

