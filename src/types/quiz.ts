export interface Quiz {
  id: string
  notebookId: string
  title: string
  questions: QuizQuestion[]
  generatedAt: Date
  sourceIds: string[]
  sourceNames?: string[]
}

export interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number // Index of correct option (0-based)
  explanation?: string
}

