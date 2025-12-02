import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenAI } from '@google/genai'

let genAI: GoogleGenAI | null = null

/**
 * Initializes and returns the GoogleGenAI instance.
 * Singleton pattern to ensure only one instance is created.
 * 
 * @throws {Error} If GEMINI_API_KEY is not set in environment variables 
 *                 OR if it could not be detected
 * @returns {GoogleGenAI} The initialized GoogleGenAI instance
 */
function getGenAI(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables')
    }
    genAI = new GoogleGenAI({ apiKey })
  }
  return genAI
}

/**
 * Main API Handler for Gemini integration.
 * Routes requests to specific generation functions based on the 'action' parameter.
 * 
 * Supported actions:
 * - generateSummary: Summarizes source texts
 * - generatePresentation: Creates markdown slides
 * - generateFlashcards: Creates study flashcards
 * - generateQuiz: Creates multiple-choice questions
 * - chatWithSources: Q&A with context
 * - streamChatResponse: Streaming Q&A
 * 
 * @param req - Vercel request object
 * @param res - Vercel response object
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Initialize genAI
    getGenAI()

    const { action, question, sourceTexts, chatHistory, numCards, numQuestions, title } = req.body

    if (!action || !sourceTexts || !Array.isArray(sourceTexts)) return res.status(400).json({ error: 'Invalid request parameters' })

    switch (action) {
      case 'generateSummary': {
        const summary = await generateSummary(sourceTexts)
        return res.status(200).json({ result: summary })
      }

      case 'generatePresentation': {
        const presentation = await generatePresentation(sourceTexts, title)
        return res.status(200).json({ result: presentation })
      }

      case 'generateFlashcards': {
        const flashcards = await generateFlashcards(sourceTexts, numCards)
        return res.status(200).json({ result: flashcards })
      }

      case 'generateQuiz': {
        const quiz = await generateQuiz(sourceTexts, numQuestions)
        return res.status(200).json({ result: quiz })
      }

      case 'chatWithSources': {
        if (!question) {
          return res.status(400).json({ error: 'Question is required' })
        }
        const answer = await chatWithSources(question, sourceTexts, chatHistory || [])
        return res.status(200).json({ result: answer })
      }

      case 'streamChatResponse': {
        if (!question) {
          return res.status(400).json({ error: 'Question is required' })
        }
        
        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')

        await streamChatResponse(question, sourceTexts, (text) => {
          res.write(`data: ${JSON.stringify({ text })}\n\n`)
        })

        res.write('data: [DONE]\n\n')
        return res.end()
      }

      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error) {
    console.error('=== ERROR ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return res.status(500).json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error?.constructor?.name || 'Unknown'
    })
  }
}

/**
 * Generates a summary of the given source texts.
 * 
 * @param sourceTexts - Array of source texts to summarize
 * @returns A Promise that resolves to the generated summary
 */
async function generateSummary(sourceTexts: string[]): Promise<string> {
  const combinedText = sourceTexts.join('\n\n---\n\n')

  const prompt = `You are an educational AI assistant. Please provide a comprehensive summary of the following study materials. Focus in key concepts, main ideas, and important details that would help students learn and understand the content.
  
Study Materials:
${combinedText}

Summary:`

  const response = await getGenAI().models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: prompt,
  })

  return response.text ?? ''
}

/**
 * Generates a markdown-formatted presentation from the given source texts.
 * 
 * @param sourceTexts - Array of source texts to generate presentation from
 * @param title - Optional title for the presentation
 * @returns A Promise that resolves to an object containing the generated presentation title and content
 */
async function generatePresentation(sourceTexts: string[], title?: string): Promise<{ title: string; content: string }> {
  const combinedText = sourceTexts.join('\n\n---\n\n')

  const titleInstruction = title ? `The presentation title should be: "${title}"` : 'Create an appropriate title for the presentation.'

  const prompt = `You are an educational AI assistant. Create a comprehensive presentation from the following study materials. 

${titleInstruction}

Format the presentation as markdown slides, where each slide is separated by exactly three dashes on a new line (---). Each slide should:
- Start with a # heading for the slide title
- Include clear, concise bullet points or paragraphs
- Be suitable for educational presentation
- Cover key concepts, main ideas, and important details
- Flow logically from one slide to the next

Aim for 8-15 slides that comprehensively cover the material.

Study Materials:
${combinedText}

Presentation (markdown format with --- separators between slides):`

  const response = await getGenAI().models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: prompt,
  })

  const content = response.text ?? ''
  
  // Extract title from first slide if not provided
  let presentationTitle = title || 'Presentation'
  if (!title && content) {
    const firstLine = content.split('\n')[0]
    if (firstLine.startsWith('#')) {
      presentationTitle = firstLine.replace(/^#+\s*/, '').trim()
    }
  }

  return {
    title: presentationTitle,
    content: content
  }
}

/**
 * Generates study flashcards in a structured JSON format.
 * 
 * @param sourceTexts - Array of source content strings
 * @param numCards - Number of flashcards to generate (default: 20)
 * @returns Promise resolving to a structured flashcard deck object
 */
async function generateFlashcards(sourceTexts: string[], numCards?: number): Promise<{ title: string; cards: Array<{ front: string; back: string }> }> {
  const combinedText = sourceTexts.join('\n\n---\n\n')
  const cardCount = numCards && numCards > 0 ? numCards : 20

  const prompt = `You are an educational AI assistant. Create study flashcards from the following study materials.

Generate exactly ${cardCount} flashcards covering the most important concepts, definitions, facts, and key information from the materials.

IMPORTANT: You must respond with ONLY valid JSON in this exact format:
{
  "title": "Title for this flashcard deck",
  "cards": [
    {
      "front": "Question or term on the front of the card",
      "back": "Answer or definition on the back of the card"
    }
  ]
}

The front should be concise (one question, term, or concept). The back should provide a clear, educational answer or explanation.

Study Materials:
${combinedText}

JSON Response:`

  const response = await getGenAI().models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: prompt,
  })

  const responseText = response.text ?? ''
  
  // Try to extract JSON from the response
  let jsonText = responseText.trim()
  
  // Remove markdown code blocks if present
  if (jsonText.startsWith('```')) {
    const lines = jsonText.split('\n')
    const startIndex = lines.findIndex(line => line.includes('{'))
    const endIndex = lines.findLastIndex(line => line.includes('}'))
    if (startIndex !== -1 && endIndex !== -1) {
      jsonText = lines.slice(startIndex, endIndex + 1).join('\n')
    }
  }
  
  // Extract JSON object
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    jsonText = jsonMatch[0]
  }

  try {
    const parsed = JSON.parse(jsonText)
    
    // Validate structure
    if (!parsed.cards || !Array.isArray(parsed.cards)) {
      throw new Error('Invalid flashcard structure: missing cards array')
    }
    
    // Ensure all cards have front and back
    const validCards = parsed.cards.filter((card: any) => 
      card && typeof card.front === 'string' && typeof card.back === 'string'
    )
    
    if (validCards.length === 0) {
      throw new Error('No valid flashcards generated')
    }
    
    return {
      title: parsed.title || 'Flashcard Deck',
      cards: validCards
    }
  } catch (error) {
    console.error('Failed to parse flashcard JSON:', error)
    console.error('Response text:', responseText)
    throw new Error('Failed to generate valid flashcard format. Please try again.')
  }
}

/**
 * Generates a multiple-choice quiz in a structured JSON format.
 * 
 * @param sourceTexts - Array of source content strings
 * @param numQuestions - Number of questions to generate (default: 10)
 * @returns Promise resolving to a structured quiz object
 */
async function generateQuiz(sourceTexts: string[], numQuestions?: number): Promise<{ title: string; questions: Array<{ question: string; options: string[]; correctAnswer: number; explanation?: string }> }> {
  const combinedText = sourceTexts.join('\n\n---\n\n')
  const questionCount = numQuestions && numQuestions > 0 ? numQuestions : 10

  const prompt = `You are an educational AI assistant. Create a quiz from the following study materials.

Generate exactly ${questionCount} multiple-choice questions covering the most important concepts, facts, and key information from the materials.

IMPORTANT: You must respond with ONLY valid JSON in this exact format:
{
  "title": "Title for this quiz",
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this answer is correct (optional but recommended)"
    }
  ]
}

Requirements:
- Each question must have exactly 4 options
- correctAnswer is the 0-based index of the correct option (0 = first option, 1 = second option, etc.)
- Questions should test understanding, not just memorization
- Include explanations when possible to help students learn
- Make questions progressively more challenging

Study Materials:
${combinedText}

JSON Response:`

  const response = await getGenAI().models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: prompt,
  })

  const responseText = response.text ?? ''
  
  // Try to extract JSON from the response
  let jsonText = responseText.trim()
  
  // Remove markdown code blocks if present
  if (jsonText.startsWith('```')) {
    const lines = jsonText.split('\n')
    const startIndex = lines.findIndex(line => line.includes('{'))
    const endIndex = lines.findLastIndex(line => line.includes('}'))
    if (startIndex !== -1 && endIndex !== -1) {
      jsonText = lines.slice(startIndex, endIndex + 1).join('\n')
    }
  }
  
  // Extract JSON object
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    jsonText = jsonMatch[0]
  }

  try {
    const parsed = JSON.parse(jsonText)
    
    // Validate structure
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid quiz structure: missing questions array')
    }
    
    // Ensure all questions have required fields
    const validQuestions = parsed.questions.filter((q: any) => 
      q && 
      typeof q.question === 'string' && 
      Array.isArray(q.options) && 
      q.options.length === 4 &&
      typeof q.correctAnswer === 'number' &&
      q.correctAnswer >= 0 &&
      q.correctAnswer < 4
    )
    
    if (validQuestions.length === 0) {
      throw new Error('No valid quiz questions generated')
    }
    
    return {
      title: parsed.title || 'Quiz',
      questions: validQuestions
    }
  } catch (error) {
    console.error('Failed to parse quiz JSON:', error)
    console.error('Response text:', responseText)
    throw new Error('Failed to generate valid quiz format. Please try again.')
  }
}

/**
 * Handles a chat interaction with the source materials.
 * 
 * @param question - The user's question
 * @param sourceTexts - Array of source content strings
 * @param chatHistory - Previous conversation history
 * @returns Promise resolving to the AI's response
 */
async function chatWithSources(
  question: string,
  sourceTexts: string[],
  chatHistory: { role: string; content: string }[] = []
): Promise<string> {
  const combinedSources = sourceTexts.join('\n\n---\n\n')

  const historyText = chatHistory.length > 0
    ? '\n\nPrevious Conversation:\n' +
      chatHistory.map(msg => `${msg.role === 'user' ? 'Student': 'Assistant'}: ${msg.content}`).join('\n')
    : ''

  const prompt = `You are an educational AI assistant. Answer the student's question based on the provided study materials. If the answer is not in the materials, say so and provide general educational guidance.

Study Materials:
${combinedSources}${historyText}

Current Student Question: ${question}

Answer:`

  const response = await getGenAI().models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: prompt,
  })

  return response.text ?? ''
}

/**
 * Streams a chat response for real-time feedback.
 * 
 * @param question - The user's question
 * @param sourceTexts - Array of source content strings
 * @param onChunk - Callback function executed for each streamed text chunk
 */
async function streamChatResponse(
  question: string,
  sourceTexts: string[],
  onChunk: (text: string) => void
): Promise<void> {
  const combinedSources = sourceTexts.join('\n\n---\n\n')

  const prompt = `You are an educational AI assistant. Answer the student's question based on the provided study materials. If the answer is not in the materials, say so and provide general educational guidance.

Study Materials:
${combinedSources}

Student Question: ${question}

Answer: `

  const stream = await getGenAI().models.generateContentStream({
    model: 'gemini-2.0-flash-exp',
    contents: prompt,
  })

  for await (const chunk of stream) {
    if (chunk.text) onChunk(chunk.text)
  }
}