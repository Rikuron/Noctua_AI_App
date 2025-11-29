export interface Source {
  id: string
  notebookId: string
  name: string
  url: string
  size: number
  uploadedAt: Date
  extractedText: string
  type: 'pdf' | 'docx' | 'txt' | 'md'
  fromRepository?: boolean
  uploadedBy?: string // Username of uploader if from Public Repository
  uploaderId?: string // User ID of uploader if from Public Repository
}

export interface SourceInput {
  name: string
  file: File
  type: 'pdf' | 'docx' | 'txt' | 'md'
}