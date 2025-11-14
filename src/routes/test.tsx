import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '../components/authProvider'
import { generateSummary, chatWithSources, streamChatResponse } from '../lib/gemini'

export const Route = createFileRoute('/test')({
  component: GeminiTestPage,
})

function GeminiTestPage() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [streamingResult, setStreamingResult] = useState('')
  const [customInput, setCustomInput] = useState('')

  // Test data
  const sampleStudyMaterial = [
    `Photosynthesis Overview:
    Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water. Photosynthesis in plants generally involves the green pigment chlorophyll and generates oxygen as a by-product.
    
    The Chemical Equation:
    6CO2 + 6H2O + light energy → C6H12O6 + 6O2
    
    Key Points:
    - Occurs in chloroplasts
    - Requires chlorophyll (the green pigment)
    - Produces glucose (C6H12O6) and oxygen (O2)
    - Essential for life on Earth as it produces oxygen`,
    
    `Types of Photosynthesis:
    There are two main types of photosynthesis reactions:
    1. Light-dependent reactions (occur in thylakoid membranes)
    2. Light-independent reactions or Calvin Cycle (occur in stroma)
    
    Factors Affecting Photosynthesis:
    - Light intensity
    - Carbon dioxide concentration
    - Temperature
    - Water availability`
  ]

  // Test 1: Generate Summary
  const testSummary = async () => {
    setLoading(true)
    setResult('')
    try {
      const summary = await generateSummary(sampleStudyMaterial)
      setResult(`✅ Summary Generated:\n\n${summary}`)
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Test 2: Chat with Sources (no history)
  const testChat = async () => {
    setLoading(true)
    setResult('')
    try {
      const response = await chatWithSources(
        'What is the chemical equation for photosynthesis?',
        sampleStudyMaterial
      )
      setResult(`✅ Chat Response:\n\n${response}`)
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Test 3: Chat with History
  const testChatWithHistory = async () => {
    setLoading(true)
    setResult('')
    try {
      const chatHistory = [
        { role: 'user', content: 'What is photosynthesis?' },
        { role: 'assistant', content: 'Photosynthesis is the process by which plants convert light energy into chemical energy.' }
      ]
      
      const response = await chatWithSources(
        'Where does it occur?',
        sampleStudyMaterial,
        chatHistory
      )
      setResult(`✅ Chat with History:\n\n${response}`)
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Test 4: Streaming Response
  const testStreaming = async () => {
    setLoading(true)
    setStreamingResult('')
    try {
      let fullResponse = ''
      await streamChatResponse(
        'Explain photosynthesis to a 10-year-old',
        sampleStudyMaterial,
        (chunk) => {
          fullResponse += chunk
          setStreamingResult(fullResponse)
        }
      )
      setStreamingResult(`✅ Streaming Complete!\n\n${fullResponse}`)
    } catch (error: any) {
      setStreamingResult(`❌ Error: ${error.message}`)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Test 5: Custom Question
  const testCustomQuestion = async () => {
    if (!customInput.trim()) return
    
    setLoading(true)
    setResult('')
    try {
      const response = await chatWithSources(
        customInput,
        sampleStudyMaterial
      )
      setResult(`✅ Response to '${customInput}':\n\n${response}`)
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Please Sign In</h1>
          <p className="text-gray-400">You need to be authenticated to test the API</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">🧪 Gemini API Test Suite</h1>
            <p className="text-gray-400">Testing @google/genai integration</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user.email}</span>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Test Controls */}
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">🧪 Test Functions</h2>
            
            <div className="space-y-3">
              <button
                onClick={testSummary}
                disabled={loading}
                className="w-full px-4 py-3 bg-primary hover:opacity-90 rounded-lg font-medium disabled:opacity-50 transition-opacity text-left"
              >
                1️⃣ Test Summary Generation
              </button>

              <button
                onClick={testChat}
                disabled={loading}
                className="w-full px-4 py-3 bg-primary hover:opacity-90 rounded-lg font-medium disabled:opacity-50 transition-opacity text-left"
              >
                2️⃣ Test Basic Chat
              </button>

              <button
                onClick={testChatWithHistory}
                disabled={loading}
                className="w-full px-4 py-3 bg-primary hover:opacity-90 rounded-lg font-medium disabled:opacity-50 transition-opacity text-left"
              >
                3️⃣ Test Chat with History
              </button>

              <button
                onClick={testStreaming}
                disabled={loading}
                className="w-full px-4 py-3 bg-secondary hover:opacity-90 rounded-lg font-medium disabled:opacity-50 transition-opacity text-left"
              >
                4️⃣ Test Streaming Response
              </button>
            </div>
          </div>

          {/* Custom Question Box */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">💬 Ask Your Own Question</h2>
            <div className="space-y-3">
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Ask anything about photosynthesis..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none"
                rows={3}
              />
              <button
                onClick={testCustomQuestion}
                disabled={loading || !customInput.trim()}
                className="w-full px-4 py-3 bg-linear-to-r from-primary to-secondary hover:opacity-90 rounded-lg font-medium disabled:opacity-50 transition-opacity"
              >
                {loading ? '⏳ Processing...' : '🚀 Send Question'}
              </button>
            </div>
          </div>

          {/* Sample Data Info */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-2">📚 Sample Study Material</h3>
            <p className="text-sm text-gray-400 mb-2">The tests use pre-loaded content about:</p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Photosynthesis overview and equation</li>
              <li>• Types of photosynthesis reactions</li>
              <li>• Factors affecting photosynthesis</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="space-y-4">
          {/* Regular Results */}
          {result && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">📊 Result</h2>
              <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                  {result}
                </pre>
              </div>
            </div>
          )}

          {/* Streaming Results */}
          {streamingResult && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">
                🌊 Streaming Result {loading && <span className="text-primary animate-pulse">●</span>}
              </h2>
              <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                  {streamingResult}
                </pre>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && !result && !streamingResult && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-400">Calling Gemini API...</p>
              </div>
            </div>
          )}

          {/* Initial State */}
          {!loading && !result && !streamingResult && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold mb-2">Ready to Test!</h3>
                <p className="text-gray-400">Click any test button to see results</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}