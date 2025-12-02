import { useState, useEffect, useCallback } from 'react'
import { getOrCreateChat, getChatMessages, addChatMessage } from '../lib/firestore/chats'
import { getNotebookSources } from '../lib/firestore/sources'
import { chatWithSources } from '../lib/gemini'

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

interface UseChatHistoryResult {
  messages: ChatMessage[]
  loading: boolean
  sending: boolean
  error: string | null
  sendMessage: (message: string) => Promise<void>
}

/**
 * Manages the chat history and interactions for a specific notebook.
 * Handles loading history, sending messages, and storing them in Firestore.
 * 
 * @param notebookId - The ID of the notebook to chat within
 * @returns Object containing messages, loading states, error, and sendMessage function
 */
export function useChatHistory(notebookId: string): UseChatHistoryResult {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatId, setChatId] = useState<string | null>(null)

  // Load chat history on mount
  useEffect(() => {
    async function loadChatHistory() {
      if (!notebookId) return

      try {
        setLoading(true)
        setError(null)

        const newChatId = await getOrCreateChat(notebookId)
        setChatId(newChatId)

        const chatMessages = await getChatMessages(notebookId, newChatId)

        // Convert to local format
        const formattedMessages = chatMessages.map(msg => ({
          role: msg.role,
          text: msg.content,
        }))

        setMessages(formattedMessages)
      } catch (err: any) {
        console.error('Error loading chat history: ', err)
        setError(err.message || 'Failed to load chat history')
      } finally {
        setLoading(false)
      }
    }    

    loadChatHistory()
  }, [notebookId])

  // Send message to chatbot
  const sendMessage = useCallback(async (userMessage: string) => {
    if (!chatId || !userMessage.trim()) return

    setSending(true)
    setError(null)

    // Add user message imemdiately
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])

    try {
      // Save user message to database
      await addChatMessage(notebookId, chatId, {
        role: 'user',
        content: userMessage,
      })

      // Fetch sources for context
      const sources = await getNotebookSources(notebookId)
      const sourceTexts = sources
        .map(s => s.extractedText)
        .filter(text => text && text !== 'Failed to extract text from PDF. Please try again.')

      // Get AI response
      let botReply = ''
      try {
        botReply = await chatWithSources(userMessage, sourceTexts, [])
      } catch (err: any) {
        console.error('Gemini API error:', err)
        botReply = 'Sorry, I encountered an error. Please try again.'
      }

      // Add bot message
      setMessages(prev => [...prev, { role: 'assistant', text: botReply }])

      // Save bot message to database
      await addChatMessage(notebookId, chatId, {
        role: 'assistant',
        content: botReply,
      })
    } catch (err: any) {
      console.error('Error sending message: ', err)
      setError(err.message || 'Failed to send message')

      // Add error message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: 'Sorry, I encountered an error. Please try again.' 
      }])
    } finally {
      setSending(false)
    }
  }, [notebookId, chatId])

  return { messages, loading, sending, error, sendMessage }
}