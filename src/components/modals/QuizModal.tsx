import { useState, useEffect } from 'react'
import { HelpCircle, Clock, FileText, Loader2, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Trophy } from 'lucide-react'
import { formatDateTime } from '../../formatters'
import { generateAndSaveQuiz, getNotebookQuizzes } from '../../lib/firestore/quizzes'
import { getNotebookSources } from '../../lib/firestore/sources'
import type { Source } from '../../types/source'
import type { Quiz } from '../../types/quiz'
import { Modal } from './Modal'
import { ErrorMessage } from '../ui/ErrorMessage'
import { MarkdownContent } from '../ui/MarkdownContent'
import { AppLoader } from '../ui/AppLoader'

interface QuizModalProps {
  isOpen: boolean
  onClose: () => void
  notebookId: string
}

export function QuizModal({ isOpen, onClose, notebookId }: QuizModalProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'generate' | 'take' | 'review'>('list')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, number>>(new Map())
  const [showResults, setShowResults] = useState(false)
  const [numQuestions, setNumQuestions] = useState(10)

  useEffect(() => {
    if (isOpen) loadData()
  }, [isOpen, notebookId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [sourcesData, quizzesData] = await Promise.all([
        getNotebookSources(notebookId),
        getNotebookQuizzes(notebookId)
      ])

      setSources(sourcesData)
      setQuizzes(quizzesData)

      // Select all sources by default
      setSelectedSourceIds(sourcesData.map(s => s.id))
    } catch (err: any) {
      console.error('Error loading data: ', err)
      setError('Failed to load quizzes. Please try again.')
    } finally { setLoading(false) }
  }

  const handleGenerateQuiz = async () => {
    if (selectedSourceIds.length === 0) {
      setError('Please select at least one source to generate a quiz.')
      return
    }

    if (numQuestions < 5 || numQuestions > 50) {
      setError('Number of questions must be between 5 and 50.')
      return
    }

    try {
      setGenerating(true)
      setError(null)
      const quizId = await generateAndSaveQuiz(notebookId, selectedSourceIds, numQuestions)

      // Reload quizzes to get the new quiz
      const updatedQuizzes = await getNotebookQuizzes(notebookId)
      setQuizzes(updatedQuizzes)

      // Show the newly created quiz
      const newQuiz = updatedQuizzes.find(q => q.id === quizId)
      if (newQuiz) {
        setCurrentQuiz(newQuiz)
        setCurrentQuestionIndex(0)
        setSelectedAnswers(new Map())
        setShowResults(false)
        setView('take')
      }
    } catch (err: any) {
      console.error('Error generating quiz: ', err)
      setError(`Failed to generate quiz: ${err.message || 'Unknown error'}`)
    } finally { setGenerating(false) }
  }

  const toggleSourceSelection = (sourceId: string) => {
    setSelectedSourceIds(prev =>
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    )
  }

  const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers(prev => {
      const newMap = new Map(prev)
      newMap.set(questionIndex, optionIndex)
      return newMap
    })
  }

  const handlePreviousQuestion = () => {
    if (currentQuiz && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleSubmitQuiz = () => {
    setShowResults(true)
    setView('review')
  }

  const calculateScore = (): { correct: number; total: number; percentage: number } => {
    if (!currentQuiz) return { correct: 0, total: 0, percentage: 0 }
    
    let correct = 0
    currentQuiz.questions.forEach((question, index) => {
      const selectedAnswer = selectedAnswers.get(index)
      if (selectedAnswer !== undefined && selectedAnswer === question.correctAnswer) {
        correct++
      }
    })

    const total = currentQuiz.questions.length
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0

    return { correct, total, percentage }
  }

  const currentQuestion = currentQuiz?.questions[currentQuestionIndex]
  const totalQuestions = currentQuiz?.questions.length || 0
  const selectedAnswer = selectedAnswers.get(currentQuestionIndex)
  const score = showResults ? calculateScore() : null

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quizzes"
      subtitle="AI-generated quizzes from your sources"
      icon={<HelpCircle className="w-5 h-5 text-white" />}
      size="lg"
    >
      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-6">
        {loading ? (
          <AppLoader size="sm" label="Loading quizzes..." />
        ) : view === 'list' ? (
          // List View
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Your Quizzes ({quizzes.length})</h3>
              <button
                onClick={() => setView('generate')}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white rounded-lg transition-colors text-sm"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="sm:hidden">New</span>
                <span className="hidden sm:inline">Generate New Quiz</span>
              </button>
            </div>

            {error && <ErrorMessage message={error} />}

            {quizzes.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">No quizzes yet</h3>
                <p className="text-gray-400 mb-6">Generate your first AI quiz from your sources</p>
                <button
                  onClick={() => setView('generate')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white rounded-lg transition-colors text-sm"
                >
                  Generate Quiz
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.map(quiz => (
                  <div
                    key={quiz.id}
                    onClick={() => {
                      setCurrentQuiz(quiz)
                      setCurrentQuestionIndex(0)
                      setSelectedAnswers(new Map())
                      setShowResults(false)
                      setView('take')
                    }}
                    className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-base font-medium text-white mb-2">{quiz.title}</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">{formatDateTime(quiz.generatedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <FileText className="w-3 h-3" />
                          <span>{quiz.sourceIds.length} source(s)</span>
                          {quiz.sourceNames && quiz.sourceNames.length > 0 && (
                            <span>• {quiz.sourceNames.slice(0, 2).join(', ')}{quiz.sourceNames.length > 2 ? '...' : ''}</span>
                          )}
                          <span>• {quiz.questions.length} questions</span>
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
              ← Back to quizzes
            </button>

            <h3 className="text-lg font-medium mb-4">Generate New Quiz</h3>

            {error && <ErrorMessage message={error} />}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Questions (5-50)
              </label>
              <input
                type="number"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value) || 10)}
                min={5}
                max={50}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Select the sources you want to include in the quiz:
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
                  onClick={handleGenerateQuiz}
                  disabled={generating || selectedSourceIds.length === 0}
                  className="w-full py-2 bg-blue-600 cursor-pointer hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <HelpCircle className="w-4 h-4" />
                      Generate {numQuestions} Questions ({selectedSourceIds.length} source{selectedSourceIds.length !== 1 ? 's' : ''})
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        ) : view === 'take' ? (
          // Take Quiz View
          <div className="flex flex-col h-full">
            <button
              onClick={() => {
                setCurrentQuiz(null)
                setCurrentQuestionIndex(0)
                setSelectedAnswers(new Map())
                setShowResults(false)
                setView('list')
              }}
              className="mb-4 text-blue-400 hover:text-blue-300 hover:cursor-pointer text-sm"
            >
              ← Back to quizzes
            </button>

            {currentQuiz && currentQuestion && (
              <div className="flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2">{currentQuiz.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{currentQuiz.sourceIds.length} source(s) used</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1 text-center">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </div>
                </div>

                {/* Question */}
                <div className="flex-1 mb-4">
                  <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                    <h4 className="text-lg font-medium text-white mb-4">
                      <MarkdownContent content={currentQuestion.question} />
                    </h4>

                    <div className="space-y-3">
                      {currentQuestion.options.map((option, optionIndex) => {
                        const isSelected = selectedAnswer === optionIndex
                        return (
                          <button
                            key={optionIndex}
                            onClick={() => handleSelectAnswer(currentQuestionIndex, optionIndex)}
                            className={`w-full text-left p-4 rounded-lg border transition-colors ${
                              isSelected
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-gray-600 border-gray-500 text-gray-200 hover:bg-gray-500'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-medium ${
                                isSelected ? 'bg-blue-500 text-white' : 'bg-gray-500 text-gray-300'
                              }`}>
                                {String.fromCharCode(65 + optionIndex)}
                              </div>
                              <span><MarkdownContent content={option} /></span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded transition-colors flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  {currentQuestionIndex === totalQuestions - 1 ? (
                    <button
                      onClick={handleSubmitQuiz}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      Submit Quiz
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Review View
          <div className="flex flex-col h-full">
            <button
              onClick={() => {
                setCurrentQuiz(null)
                setCurrentQuestionIndex(0)
                setSelectedAnswers(new Map())
                setShowResults(false)
                setView('list')
              }}
              className="mb-4 text-blue-400 hover:text-blue-300 hover:cursor-pointer text-sm"
            >
              ← Back to quizzes
            </button>

            {currentQuiz && score && (
              <div className="flex-1 flex flex-col">
                {/* Score Display */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 mb-6 border border-blue-500">
                  <div className="text-center">
                    <Trophy className="w-12 h-12 text-yellow-300 mx-auto mb-3" />
                    <h3 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h3>
                    <div className="text-4xl font-bold text-white mb-2">{score.percentage}%</div>
                    <div className="text-blue-200">
                      {score.correct} out of {score.total} questions correct
                    </div>
                  </div>
                </div>

                {/* Question Review */}
                <div className="flex-1 overflow-y-auto space-y-4">
                  {currentQuiz.questions.map((question, index) => {
                    const selectedAnswer = selectedAnswers.get(index)
                    const isCorrect = selectedAnswer === question.correctAnswer

                    return (
                      <div
                        key={index}
                        className={`bg-gray-700 rounded-lg p-4 border ${
                          isCorrect ? 'border-green-500' : 'border-red-500'
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="text-sm text-gray-400 mb-1">Question {index + 1}</div>
                            <h4 className="text-white font-medium mb-3">
                              <MarkdownContent content={question.question} />
                            </h4>
                          </div>
                        </div>

                        <div className="space-y-2 ml-8">
                          {question.options.map((option, optionIndex) => {
                            const isSelected = selectedAnswer === optionIndex
                            const isCorrectOption = optionIndex === question.correctAnswer

                            let bgClass = 'bg-gray-600'
                            let borderClass = 'border-gray-500'
                            let textClass = 'text-gray-200'

                            if (isCorrectOption) {
                              bgClass = 'bg-green-600/30'
                              borderClass = 'border-green-500'
                              textClass = 'text-green-200'
                            } else if (isSelected && !isCorrect) {
                              bgClass = 'bg-red-600/30'
                              borderClass = 'border-red-500'
                              textClass = 'text-red-200'
                            }

                            return (
                              <div
                                key={optionIndex}
                                className={`p-3 rounded-lg border ${bgClass} ${borderClass} ${textClass}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {String.fromCharCode(65 + optionIndex)}.
                                  </span>
                                  <span><MarkdownContent content={option} /></span>
                                  {isCorrectOption && (
                                    <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />
                                  )}
                                  {isSelected && !isCorrect && (
                                    <XCircle className="w-4 h-4 text-red-400 ml-auto" />
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {question.explanation && (
                          <div className="mt-3 ml-8 p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                            <div className="text-sm text-blue-200">
                              <strong>Explanation:</strong> <MarkdownContent content={question.explanation} />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

