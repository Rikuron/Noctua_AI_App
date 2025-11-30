import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenAI } from '@google/genai'

let genAI: GoogleGenAI | null = null

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Initialize genAI
    getGenAI()

    const { action, question, sourceTexts, chatHistory, title } = req.body

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