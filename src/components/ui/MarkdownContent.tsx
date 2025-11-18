import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { markdownComponents, markdownComponentsCompact } from '../markdown'

interface MarkdownContentProps {
  content: string
  compact?: boolean
  className?: string
}

// Reusable markdown content renderer
export function MarkdownContent({ 
  content, 
  compact = false, 
  className = '' 
}: MarkdownContentProps) {
  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={compact ? markdownComponentsCompact : markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}