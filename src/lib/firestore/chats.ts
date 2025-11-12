import {
  collection, 
  doc,
  getDoc,
  addDoc,
  updateDoc,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore'
import { db } from '../../firebase'
import type { ChatMessage } from '../../types/chat'

// Function to get or create a chat for a notebook
export async function getOrCreateChat(notebookId: string): Promise<string> {
  const chatId = `chat_${notebookId}`
  const docRef = doc(db, `notebooks/${notebookId}/chats`, chatId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    await addDoc(collection(db, `notebooks/${notebookId}/chats`), {
      messages: [],
      createdAt: Timestamp.now()
    })
  }

  return chatId
}

// Function to add a message to a chat
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