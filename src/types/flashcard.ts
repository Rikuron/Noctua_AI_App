export interface Flashcard {
  id: string
  notebookId: string
  title: string
  cards: FlashcardItem[]
  generatedAt: Date
  sourceIds: string[]
  sourceNames?: string[]
}

export interface FlashcardItem {
  front: string
  back: string
}

