import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
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
    <div className={`max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={compact ? markdownComponentsCompact : markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}