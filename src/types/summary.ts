export interface Summary {
  id: string
  notebookId: string
  content: string
  generatedAt: Date
  sourceIds: string[]
  sourceNames?: string[]
}