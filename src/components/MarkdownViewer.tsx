import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { MarkdownContent } from './ui/MarkdownContent'
import { AppLoader } from './ui/AppLoader'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'

interface MarkdownViewerProps {
  url: string
  name: string
  onClose: () => void
}

export function MarkdownViewer({ url, name, onClose }: MarkdownViewerProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useLockBodyScroll()

  useEffect(() => {
    async function fetchMarkdown() {
      try {
        setLoading(true)
        const response = await fetch(url)

        if (!response.ok) throw new Error('Failed to fetch markdown content')
        
        const text = await response.text()
        setContent(text)
      } catch (error) {
        console.error('Error fetching markdown content:', error)
        setError(error instanceof Error ? error.message : 'An error occurred while fetching the markdown content')
      } finally {
        setLoading(false)
      }
    }

    if (url) fetchMarkdown()
  }, [url])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl h-[85vh] bg-gray-900 rounded-xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800/50">
          <h3 className="text-lg font-semibold text-white truncate pr-4">{name}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 cursor-pointer hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <AppLoader label="Loading markdown content..." />
          ) : error ? (
            <p className="text-red-500 text-center">Error loading markdown content: {error}</p>
          ) : (
            <MarkdownContent content={content} />
          )}
        </div>
      </div>
    </div>
  )
}