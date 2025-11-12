import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY

if (!apiKey) throw new Error('Google Gemini API key is not set. Please check your environment variables.')

const genAI = new GoogleGenerativeAI(apiKey)

// Gemini Model
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash'})

// Function to Generate Summary of Source PDF 
export async function generateSummary(sourceTexts: string[]): Promise<string> {
  const combinedText = sourceTexts.join('\n\n---\n\n')

  const prompt = `You are an educational AI assistant. Please provide a comprehensive summary of the following study materials. Focus in key concepts, main ideas, and important details that would help students learn and understand the content.
  
Study Materials:
${combinedText}

Summary:`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

// Function to Chat with Sources
export async function chatWithSources(
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

  const result = await model.generateContent(prompt)
  return result.response.text()
}

// 
export async function streamChatResponse(
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

  const result = await model.generateContentStream(prompt)

  for await (const chunk of result.stream) {
    const chunkText = chunk.text()
    onChunk(chunkText)
  }
}