export interface Notebook {
  id: string
  userId: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
}

export interface NotebookInput {
  name: string
  description: string
}