export interface Presentation {
  id: string
  notebookId: string
  title: string
  content: string // Markdown format with slide separators
  generatedAt: Date
  sourceIds: string[]
  sourceNames?: string[]
}

