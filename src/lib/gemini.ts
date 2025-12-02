const API_ENDPOINT = '/api/gemini'

/**
 * Requests a summary of the provided source texts from the API.
 * 
 * @param sourceTexts - Array of strings to summarize
 * @returns Promise resolving to the summary string
 */
export async function generateSummary(sourceTexts: string[]): Promise<string> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'generateSummary',
      sourceTexts,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to generate summary')
  }

  const data = await response.json()
  return data.result
}

/**
 * Requests the generation of flashcards from the API.
 * 
 * @param sourceTexts - Array of source content strings
 * @param numCards - Optional number of cards to generate
 * @returns Promise resolving to the flashcard deck object
 */
export async function generateFlashcards(
  sourceTexts: string[],
  numCards?: number
): Promise<{ title: string; cards: Array<{ front: string; back: string }> }> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'generateFlashcards',
      sourceTexts,
      numCards,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to generate flashcards')
  }

  const data = await response.json()
  return data.result
}

/**
 * Requests the generation of a quiz from the API.
 * 
 * @param sourceTexts - Array of source content strings
 * @param numQuestions - Optional number of questions to generate
 * @returns Promise resolving to the quiz object
 */
export async function generateQuiz(
  sourceTexts: string[],
  numQuestions?: number
): Promise<{ title: string; questions: Array<{ question: string; options: string[]; correctAnswer: number; explanation?: string }> }> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'generateQuiz',
      sourceTexts,
      numQuestions,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to generate quiz')
  }

  const data = await response.json()
  return data.result
}

/**
 * Requests the generation of a presentation from the API.
 * 
 * @param sourceTexts - Array of source content strings
 * @param title - Optional title for the presentation
 * @returns Promise resolving to the presentation object
 */
export async function generatePresentation(
  sourceTexts: string[],
  title?: string
): Promise<{ title: string; content: string }> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'generatePresentation',
      sourceTexts,
      title,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to generate presentation')
  }

  const data = await response.json()
  return data.result
}

/**
 * Sends a user question to the API to chat with the source materials.
 * 
 * @param question - The user's question
 * @param sourceTexts - Array of source content strings
 * @param chatHistory - Optional history of the conversation
 * @returns Promise resolving to the AI's answer
 */
export async function chatWithSources(
  question: string,
  sourceTexts: string[],
  chatHistory: { role: string; content: string }[] = []
): Promise<string> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'chatWithSources',
      question,
      sourceTexts,
      chatHistory,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to chat with sources')
  }

  const data = await response.json()
  return data.result
}

/**
 * Initiates a streaming chat response from the API.
 * Handles the Server-Sent Events (SSE) stream and parses chunks.
 * 
 * @param question - The user's question
 * @param sourceTexts - Array of source content strings
 * @param onChunk - Callback function called for each text chunk received
 * @returns Promise that resolves when the stream is complete
 */
export async function streamChatResponse(
  question: string,
  sourceTexts: string[],
  onChunk: (text: string) => void
): Promise<void> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'streamChatResponse',
      question,
      sourceTexts,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to stream chat response')
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) throw new Error('No response body')

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return
        
        try {
          const parsed = JSON.parse(data)
          if (parsed.text) onChunk(parsed.text)
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }
}