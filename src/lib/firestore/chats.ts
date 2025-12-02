import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore'
import { db } from '../../firebase'
import type { ChatMessage } from '../../types/chat'

/**
 * Gets an existing chat session ID for a notebook or creates a new one if it doesn't exist.
 * Uses a deterministic ID format `chat_${notebookId}` to ensure one chat per notebook.
 * 
 * @param notebookId - The ID of the notebook
 * @returns Promise resolving to the chat ID
 */
export async function getOrCreateChat(notebookId: string): Promise<string> {
  const chatId = `chat_${notebookId}`
  const docRef = doc(db, `notebooks/${notebookId}/chats`, chatId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    await setDoc(docRef, {
      messages: [],
      createdAt: Timestamp.now()
    })
  }

  return chatId
}

/**
 * Adds a new message to the chat history in Firestore.
 * Uses `arrayUnion` to append the message to the `messages` array.
 * 
 * @param notebookId - The ID of the notebook
 * @param chatId - The ID of the chat session
 * @param message - The message object (role and content)
 */
export async function addChatMessage(
  notebookId: string,
  chatId: string,
  message: Omit<ChatMessage, 'timestamp'>
): Promise<void> {
  const docRef = doc(db, `notebooks/${notebookId}/chats`, chatId)

  await updateDoc(docRef, {
    messages: arrayUnion({
      ...message,
      timestamp: Timestamp.now()
    }),
  })
}

/**
 * Retrieves the full chat history for a specific notebook.
 * 
 * @param notebookId - The ID of the notebook
 * @param chatId - The ID of the chat session
 * @returns Promise resolving to an array of ChatMessage objects
 */
export async function getChatMessages(
  notebookId: string,
  chatId: string
): Promise<ChatMessage[]> {
  const docRef = doc(db, `notebooks/${notebookId}/chats`, chatId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) return []

  const data = docSnap.data()
  return (data.messages || []).map((msg: any) => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp.toDate()
  }))
}