export interface Notebook {
  id: string
  userId: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  icon?: string
}

export interface NotebookInput {
  name: string
  description: string
  icon?: string
}