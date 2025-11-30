import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { ErrorMessage } from '../ui/ErrorMessage'
import { MarkdownContent } from '../ui/MarkdownContent'
import { useAutoScrollToLatestChat } from '../../hooks/useAutoScrollToLatestChat'
import { AppLoader } from '../ui/AppLoader'

interface ChatAreaProps {
  activeTab: 'chat' | 'sources' | 'studio'
  chatMessages: Array<{ role: 'user' | 'assistant'; text: string }>
  chatLoading: boolean
  publicSourcesError: string | null
  onSendMessage: (message: string) => Promise<void>
}

export function ChatArea({
  activeTab,
  chatMessages,
  chatLoading,
  publicSourcesError,
  onSendMessage
}: ChatAreaProps) {
  const [chatInput, setChatInput] = useState('')
  const { containerRef: messagesContainerRef } = useAutoScrollToLatestChat(chatMessages)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    
    const message = chatInput
    setChatInput('')
    await onSendMessage(message)
  }

  return (
    <div className={`${
      activeTab === 'chat' ? 'flex' : 'hidden'
    } lg:flex flex-1 flex-col bg-gray-900 min-h-0`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
        <MessageCircle className="w-5 h-5" />
        <span className="font-medium">Chat</span>
      </div>

      {/* Error display */}
      {publicSourcesError && (
        <div className="p-4">
          <ErrorMessage message={publicSourcesError} />
        </div>
      )}
      
      {/* Full screen chat container */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col w-full mx-auto overflow-hidden min-h-0">
          {/* Full height messages container */}
          <div ref={messagesContainerRef} className="flex-1 bg-gray-800 p-4 overflow-y-auto custom-scrollbar">
            {chatMessages.length === 0 && !chatLoading ? (
              <div className="text-center text-gray-400 py-8 h-full flex items-center justify-center">
                Start chatting with your notebook sources!
              </div>
            ) : (
              <div className="space-y-4 max-w-5xl mx-auto">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'user' ? (
                      <div className="px-4 py-3 rounded-lg max-w-[80%] bg-blue-600 text-white">
                        <div className="whitespace-pre-wrap wrap-break-word">{msg.text}</div>
                      </div>
                    ) : (
                      <div className="px-4 py-3 rounded-lg max-w-[85%] bg-gray-700">
                        <MarkdownContent content={msg.text} compact={true} />
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Loading indicator */}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 rounded-lg bg-gray-700">
                      <AppLoader size="sm" label="Thinking..." />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input form at bottom */}
          <div className="p-4 border-t border-gray-700 bg-gray-900 shrink-0">
            <form
              className="flex gap-2 max-w-5xl mx-auto"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-600 bg-gray-900 text-white focus:outline-none focus:border-blue-500"
                placeholder="Type your message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={chatLoading}
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:cursor-pointer hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                disabled={chatLoading || !chatInput.trim()}
              >
                {chatLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}