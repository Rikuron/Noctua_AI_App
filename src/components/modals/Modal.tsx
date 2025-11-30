import { X } from 'lucide-react'
import { useEffect } from 'react'
import { CustomScrollbarStyles } from '../CustomScrollbar'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  icon?: React.ReactNode
  showCloseButton?: boolean
  className?: string
  headerClassName?: string
  iconWrapperClassName?: string
  titleWrapperClassName?: string
}

// Reusable modal wrapper component
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  icon,
  showCloseButton = true,
  className = '',
  headerClassName = '',
  iconWrapperClassName,
  titleWrapperClassName,
}: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  }

  useLockBodyScroll(isOpen)

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <CustomScrollbarStyles />
      <div
        className={`bg-gray-800 rounded-2xl w-full ${sizeClasses[size]} border border-gray-600 max-h-[95vh] flex flex-col shadow-2xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || icon || showCloseButton) && (
          <div className={`flex items-center justify-between border-b border-gray-700 p-6 ${headerClassName}`}>
            <div className="flex items-center gap-3">
              {icon && (
                <div
                  className={
                    iconWrapperClassName ??
                    'w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center'
                  }
                >
                  {icon}
                </div>
              )}
              {title && (
                <div className={titleWrapperClassName}>
                  <h2 className="text-xl font-semibold">{title}</h2>
                  {subtitle && (
                    <p className="text-sm text-gray-400">{subtitle}</p>
                  )}
                </div>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors hover:cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {children}
        </div>
      </div>
    </div>
  )
}