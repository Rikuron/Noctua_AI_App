export interface Source {
  id: string
  notebookId: string
  name: string
  url: string
  size: number
  uploadedAt: Date
  extractedText: string
  type: 'pdf' | 'docx' | 'txt' | 'md'
}

export interface SourceInput {
  name: string
  file: File
  type: 'pdf' | 'docx' | 'txt' | 'md'
}