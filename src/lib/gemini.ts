const API_ENDPOINT = '/api/gemini'

// Function to Generate Summary of Source PDF 
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

// Function to Generate Flashcards from Sources
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

// Function to Generate Quiz from Sources
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

// Function to Generate Presentation from Sources
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

// Function to Chat with Sources
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

// Function to Stream Chat Response
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