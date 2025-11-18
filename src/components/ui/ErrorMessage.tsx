import { AlertCircle, X } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  onDismiss?: () => void
  className?: string
}

// Consistent error message display component
export function ErrorMessage({ message, onDismiss, className = '' }: ErrorMessageProps) {
  return (
    <div className={`p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3 ${className}`}>
      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
      <p className="text-red-400 text-sm flex-1">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-300 transition-colors"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}