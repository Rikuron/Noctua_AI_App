import { useState, useEffect } from 'react'
import { StickyNote, Clock, FileText, Loader2, ChevronLeft, ChevronRight, RotateCcw, RotateCw, Copy, FileCode, FileImage, Trash2 } from 'lucide-react'
import { formatDateTime } from '../../utils/formatters'
import { generateAndSaveFlashcards, getNotebookFlashcards, deleteFlashcard } from '../../lib/firestore/flashcards'
import { getNotebookSources } from '../../lib/firestore/sources'
import type { Source } from '../../types/source'
import type { Flashcard } from '../../types/flashcard'
import { Modal } from './Modal'
import { ErrorMessage } from '../ui/ErrorMessage'
import { MarkdownContent } from '../ui/MarkdownContent'
import { AppLoader } from '../ui/AppLoader'
import { downloadUtils } from '../../utils/download'
import removeMarkdown from 'remove-markdown'

interface FlashcardModalProps {
  isOpen: boolean
  onClose: () => void
  notebookId: string
}

export function FlashcardModal({ isOpen, onClose, notebookId }: FlashcardModalProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentFlashcard, setCurrentFlashcard] = useState<Flashcard | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [downloadingFormat, setDownloadingFormat] = useState<'txt' | 'md' | 'pdf' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'generate' | 'study'>('list')
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [numCards, setNumCards] = useState(20)
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (isOpen) loadData()
  }, [isOpen, notebookId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccessMessage(null)

      const [sourcesData, flashcardsData] = await Promise.all([
        getNotebookSources(notebookId),
        getNotebookFlashcards(notebookId)
      ])

      setSources(sourcesData)
      setFlashcards(flashcardsData)

      // Select all sources by default
      setSelectedSourceIds(sourcesData.map(s => s.id))
    } catch (err: any) {
      console.error('Error loading data: ', err)
      setError('Failed to load flashcards. Please try again.')
    } finally { setLoading(false) }
  }

  const handleGenerateFlashcards = async () => {
    if (selectedSourceIds.length === 0) {
      setError('Please select at least one source to generate flashcards.')
      return
    }

    if (numCards < 5 || numCards > 100) {
      setError('Number of cards must be between 5 and 100.')
      return
    }

    try {
      setGenerating(true)
      setError(null)
      setSuccessMessage(null)
      const flashcardId = await generateAndSaveFlashcards(notebookId, selectedSourceIds, numCards)

      // Reload flashcards to get the new deck
      const updatedFlashcards = await getNotebookFlashcards(notebookId)
      setFlashcards(updatedFlashcards)

      // Show the newly created flashcard deck
      const newFlashcard = updatedFlashcards.find(f => f.id === flashcardId)
      if (newFlashcard) {
        setCurrentFlashcard(newFlashcard)
        setCurrentCardIndex(0)
        setIsFlipped(false)
        setStudiedCards(new Set())
        setView('study')
        setSuccessMessage('Flashcards generated successfully!')
      }
    } catch (err: any) {
      console.error('Error generating flashcards: ', err)
      setError(`Failed to generate flashcards: ${err.message || 'Unknown error'}`)
    } finally { setGenerating(false) }
  }

  const toggleSourceSelection = (sourceId: string) => {
    setSelectedSourceIds(prev =>
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    )
  }

  const handlePreviousCard = () => {
    if (currentFlashcard && currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleNextCard = () => {
    if (currentFlashcard && currentCardIndex < currentFlashcard.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setIsFlipped(false)
      setStudiedCards(prev => new Set([...prev, currentCardIndex]))
    }
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
    if (!isFlipped) {
      setStudiedCards(prev => new Set([...prev, currentCardIndex]))
    }
  }

  // Function to format flashcard content for download
  const formatFlashcardsForDownload = (flashcard: Flashcard): string => {
    let formattedContent = `# ${flashcard.title}\n\n`
    formattedContent += `Generated: ${formatDateTime(flashcard.generatedAt)}\n`
    if (flashcard.sourceNames && flashcard.sourceNames.length > 0) {
      formattedContent += `Sources: ${flashcard.sourceNames.join(', ')}\n`
    }
    formattedContent += `\n---\n\n`

    flashcard.cards.forEach((card, index) => {
      formattedContent += `## Card ${index + 1}\n\n`
      formattedContent += `**Q:** ${card.front}\n\n`
      formattedContent += `**A:** ${card.back}\n\n`
      formattedContent += `---\n\n`
    })

    return formattedContent
  }

  const handleDownload = async (format: 'txt' | 'md' | 'pdf') => {
    if (!currentFlashcard) return

    try {
      setDownloadingFormat(format)
      setError(null)
      setSuccessMessage(null)

      const filename = `flashcards-${currentFlashcard.id.slice(0, 8)}-${Date.now()}`
      const sourceNames = currentFlashcard.sourceNames || []
      const generatedAt = currentFlashcard.generatedAt
      const flashcardContent = formatFlashcardsForDownload(currentFlashcard)

      switch (format) {
        case 'txt':
          const plainText = removeMarkdown(flashcardContent, {
            stripListLeaders: true,
            listUnicodeChar: '•',
            gfm: true,
            useImgAltText: true,
          })
          downloadUtils.txt(plainText, filename)
          setSuccessMessage('TXT file downloaded successfully!')
          break
        case 'md':
          downloadUtils.md(flashcardContent, filename)
          setSuccessMessage('Markdown file downloaded successfully!')
          break
        case 'pdf':
          await downloadUtils.pdf(
            flashcardContent,
            filename,
            sourceNames,
            generatedAt,
            currentFlashcard.title
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
    if (!currentFlashcard) return

    try {
      const flashcardContent = formatFlashcardsForDownload(currentFlashcard)
      // Convert markdown to plain text before copying
      const plainText = removeMarkdown(flashcardContent, {
        stripListLeaders: true,
        listUnicodeChar: '•',
        gfm: true,
        useImgAltText: true,
      })

      await navigator.clipboard.writeText(plainText)
      setSuccessMessage('Flashcards copied to clipboard!')
    } catch (err) {
      console.error('Error copying to clipboard:', err)
      setError('Failed to copy to clipboard')
    }
  }

  const handleDelete = async (flashcardId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()

    if (!confirm('Are you sure you want to delete this flashcard deck? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(flashcardId)
      setError(null)
      await deleteFlashcard(notebookId, flashcardId)

      // Remove from local state
      setFlashcards(prev => prev.filter(f => f.id !== flashcardId))

      // If we're viewing this deck, go back to list
      if (currentFlashcard?.id === flashcardId) {
        setCurrentFlashcard(null)
        setView('list')
      }

      setSuccessMessage('Flashcard deck deleted successfully')
    } catch (err) {
      console.error('Error deleting flashcard deck:', err)
      setError('Failed to delete flashcard deck')
    } finally {
      setDeletingId(null)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    if (view !== 'study' || !isOpen) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePreviousCard()
      if (e.key === 'ArrowRight') handleNextCard()
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleFlip()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [view, isOpen, currentCardIndex, isFlipped, currentFlashcard])

  const currentCard = currentFlashcard?.cards[currentCardIndex]
  const totalCards = currentFlashcard?.cards.length || 0
  const progress = totalCards > 0 ? ((studiedCards.size / totalCards) * 100).toFixed(0) : 0

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Flashcards"
      subtitle="AI-generated study flashcards from your sources"
      icon={<StickyNote className="w-5 h-5 text-white" />}
      size="lg"
    >
      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-6">
        {loading ? (
          <AppLoader size="sm" label="Loading flashcards..." />
        ) : view === 'list' ? (
          // List View
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Your Flashcard Decks ({flashcards.length})</h3>
              <button
                onClick={() => setView('generate')}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white rounded-lg transition-colors text-sm"
              >
                <StickyNote className="w-4 h-4" />
                <span className="sm:hidden">New</span>
                <span className="hidden sm:inline">Generate New Deck</span>
              </button>
            </div>

            {error && <ErrorMessage message={error} />}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-800 text-green-400 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            {flashcards.length === 0 ? (
              <div className="text-center py-12">
                <StickyNote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">No flashcard decks yet</h3>
                <p className="text-gray-400 mb-6">Generate your first AI flashcard deck from your sources</p>
                <button
                  onClick={() => setView('generate')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white rounded-lg transition-colors text-sm"
                >
                  Generate Flashcards
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {flashcards.map(flashcard => (
                  <div
                    key={flashcard.id}
                    onClick={() => {
                      setCurrentFlashcard(flashcard)
                      setCurrentCardIndex(0)
                      setIsFlipped(false)
                      setStudiedCards(new Set())
                      setView('study')
                    }}
                    className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-gray-500 hover:bg-gray-650 cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-base font-medium text-white mb-2">{flashcard.title}</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">{formatDateTime(flashcard.generatedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <FileText className="w-3 h-3" />
                          <span>{flashcard.sourceIds.length} source(s)</span>
                          {flashcard.sourceNames && flashcard.sourceNames.length > 0 && (
                            <span>• {flashcard.sourceNames.slice(0, 2).join(', ')}{flashcard.sourceNames.length > 2 ? '...' : ''}</span>
                          )}
                          <span>• {flashcard.cards.length} cards</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDelete(flashcard.id, e)}
                          disabled={deletingId === flashcard.id}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete flashcard deck"
                        >
                          {deletingId === flashcard.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                        <StickyNote className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
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
              ← Back to flashcard decks
            </button>

            <h3 className="text-lg font-medium mb-4">Generate New Flashcard Deck</h3>

            {error && <ErrorMessage message={error} />}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-800 text-green-400 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Cards (5-100)
              </label>
              <input
                type="number"
                value={numCards}
                onChange={(e) => setNumCards(parseInt(e.target.value) || 20)}
                min={5}
                max={100}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Select the sources you want to include in the flashcard deck:
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
                  onClick={handleGenerateFlashcards}
                  disabled={generating || selectedSourceIds.length === 0}
                  className="w-full py-2 bg-blue-600 cursor-pointer hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Flashcards...
                    </>
                  ) : (
                    <>
                      <StickyNote className="w-4 h-4" />
                      Generate {numCards} Flashcards ({selectedSourceIds.length} source{selectedSourceIds.length !== 1 ? 's' : ''})
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        ) : (
          // Study View
          <div className="flex flex-col h-full">
            <button
              onClick={() => {
                setCurrentFlashcard(null)
                setCurrentCardIndex(0)
                setIsFlipped(false)
                setStudiedCards(new Set())
                setView('list')
              }}
              className="mb-4 text-blue-400 hover:text-blue-300 hover:cursor-pointer text-sm flex items-center gap-1"
            >
              ← Back to flashcard decks
            </button>

            {error && <ErrorMessage message={error} />}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-800 text-green-400 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            {currentFlashcard && currentCard && (
              <div className="flex-1 flex flex-col">
                {/* Header with metadata and download buttons */}
                <div className="bg-linear-to-r from-gray-800 to-gray-900 rounded-lg p-5 mb-6 border border-gray-700">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{currentFlashcard.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                        <Clock className="w-4 h-4" />
                        <span>{formatDateTime(currentFlashcard.generatedAt)}</span>
                        <span className="mx-2">•</span>
                        <FileText className="w-4 h-4" />
                        <span>{currentFlashcard.sourceIds.length} source{currentFlashcard.sourceIds.length !== 1 ? 's' : ''} used</span>
                      </div>

                      {currentFlashcard.sourceNames && currentFlashcard.sourceNames.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {currentFlashcard.sourceNames.map((name, index) => (
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

                    {/* Download Buttons */}
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
                        onClick={() => currentFlashcard && handleDelete(currentFlashcard.id)}
                        disabled={deletingId === currentFlashcard?.id}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-red-900/30 text-gray-300 hover:text-red-400 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors text-sm border border-transparent hover:border-red-900/50"
                        title="Delete flashcard deck"
                      >
                        {deletingId === currentFlashcard?.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1 text-center">
                    {progress}% complete • {studiedCards.size} of {totalCards} studied
                  </div>
                </div>

                {/* Card Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handlePreviousCard}
                    disabled={currentCardIndex === 0}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded transition-colors flex items-center gap-2 text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-300">
                    Card {currentCardIndex + 1} of {totalCards}
                  </span>
                  <button
                    onClick={handleNextCard}
                    disabled={currentCardIndex === totalCards - 1}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded transition-colors flex items-center gap-2 text-sm"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Flashcard */}
                <div className="flex-1 flex items-center justify-center mb-4">
                  <div
                    className="w-full max-w-2xl h-64 perspective-1000 cursor-pointer"
                    onClick={handleFlip}
                    style={{ perspective: '1000px' }}
                  >
                    <div
                      className="relative w-full h-full preserve-3d transition-transform duration-500"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      }}
                    >
                      {/* Front of Card */}
                      <div
                        className="absolute inset-0 backface-hidden bg-linear-to-br from-blue-600 to-blue-700 rounded-lg p-6 border border-blue-500 shadow-lg flex items-center justify-center"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <div className="text-center">
                          <div className="text-blue-200 text-sm mb-2 font-medium">QUESTION</div>
                          <div className="text-white text-lg font-medium">
                            <MarkdownContent content={currentCard.front} />
                          </div>
                        </div>
                      </div>

                      {/* Back of Card */}
                      <div
                        className="absolute inset-0 backface-hidden bg-linear-to-br from-green-600 to-green-700 rounded-lg p-6 border border-green-500 shadow-lg flex items-center justify-center rotate-y-180"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                      >
                        <div className="text-center">
                          <div className="text-green-200 text-sm mb-2 font-medium">ANSWER</div>
                          <div className="text-white text-lg">
                            <MarkdownContent content={currentCard.back} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flip Button */}
                <div className="flex justify-center mb-4">
                  <button
                    onClick={handleFlip}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    {isFlipped ? (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        Show Question
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-4 h-4" />
                        Show Answer
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs text-gray-400 text-center">
                  Press Space or Enter to flip • Use arrow keys to navigate
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}