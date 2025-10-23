import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CustomUserButton } from '../components/userButton'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/chatbot')({
  component: ChatbotPage,
})

function ChatbotPage() {
  const [input, setInput] = React.useState('')
  const [messages, setMessages] = React.useState([
    {
      role: 'assistant',
      content: "Hello! I'm your AI assistant. How can I help you today?"
    }
  ])


  const handleSubmit = () => {
    if (!input.trim()) return
    setMessages([...messages, { role: 'user', content: input }])
    setInput('')
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm a demo interface. In a real implementation, this would be connected to an AI model."
      }])
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex h-screen bg-[#1a1a1a] text-white">
      
      {/* Sidebar */}
      <div className="w-64 bg-[#0f0f0f] border-r border-gray-800 flex flex-col">
        <div className="p-4 border-gray-800 flex items-center gap-3">
          <img src='/logo512.png' alt="Logo" className="w-10 h-10" />
          <span className="text-lg font-semibold text-primary">Noctua AI</span>
        </div>
        <div className="p-3">
          <button className="w-full px-4 py-3 bg-linear-to-r from-primary to-secondary rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-2 text-xs text-gray-500 font-semibold">Today</div>
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 text-sm text-gray-300 truncate">Previous conversation example</button>
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 text-sm text-gray-300 truncate">Another chat example</button>
        </div>
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <CustomUserButton />
            <span className="text-sm text-gray-300">Account</span>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <nav className="flex items-center justify-between px-8 py-5 bg-[#0f0f0f] shadow-sm">
              <div></div>
              <div className="flex items-center gap-6">
                <Link to="/dashboard" className="text-lg font-medium text-white hover:text-secondary transition-colors">Dashboard</Link>
                <Link to="/chatbot" className="text-lg font-medium text-primary border-b-2 border-primary">Chatbot</Link>
                <Link to="/repository" className="text-lg font-medium text-white hover:text-secondary transition-colors">Repository</Link>
                <CustomUserButton />
              </div>
            </nav>
        <div className="h-14 flex items-center justify-between px-6 shadow-md">
          <h1 className="text-lg font-semibold">Title of Chat</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 max-w-3xl mx-auto">
              <img src='/logo512.png' alt="Logo" className="w-16 h-16 mb-6 opacity-80" />
              <h2 className="text-3xl font-bold mb-4 bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">What can I help you with?</h2>
              <div className="grid grid-cols-2 gap-3 w-full mt-8">
                <button className="p-4 rounded-xl border border-gray-700 hover:border-gray-600 text-left hover:bg-gray-800/50 transition-all">
                  <div className="text-sm font-medium mb-1">Generate code</div>
                  <div className="text-xs text-gray-400">Create a React component</div>
                </button>
                <button className="p-4 rounded-xl border border-gray-700 hover:border-gray-600 text-left hover:bg-gray-800/50 transition-all">
                  <div className="text-sm font-medium mb-1">Explain concept</div>
                  <div className="text-xs text-gray-400">Help me understand something</div>
                </button>
                <button className="p-4 rounded-xl border border-gray-700 hover:border-gray-600 text-left hover:bg-gray-800/50 transition-all">
                  <div className="text-sm font-medium mb-1">Write content</div>
                  <div className="text-xs text-gray-400">Draft an email or article</div>
                </button>
                <button className="p-4 rounded-xl border border-gray-700 hover:border-gray-600 text-left hover:bg-gray-800/50 transition-all">
                  <div className="text-sm font-medium mb-1">Analyze data</div>
                  <div className="text-xs text-gray-400">Get insights from information</div>
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-6 py-8">
              {messages.map((msg, idx) => (
                <div key={idx} className={`mb-8 flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-linear-to-r from-primary to-secondary' : 'bg-gray-700'}`}>
                    {msg.role === 'user' ? 'U' : (
                      <img src='/logo512.png' alt="AI" className="w-6 h-6" />
                    )}
                  </div>
                  <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-linear-to-r from-primary to-secondary' : 'bg-gray-800'}`}>{msg.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 shadow-2xl">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-3 bg-gray-800 rounded-2xl p-3">
              <button type="button" className="p-2 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Message AI Assistant..." className="flex-1 bg-transparent border-none outline-none resize-none text-white placeholder-gray-500 max-h-32 mb-1.5" rows={1} />
              <button onClick={handleSubmit} disabled={!input.trim()} className="p-2 rounded-lg bg-linear-to-r from-primary to-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="text-xs text-gray-500 text-center mt-3">AI can make mistakes. Check important info.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
