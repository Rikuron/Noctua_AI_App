export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface Chat {
  id: string
  notebookId: string
  messages: ChatMessage[]
  createdAt: Date
}