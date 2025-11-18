import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../authProvider'

interface CustomUserButtonProps {
  alwaysExpanded?: boolean
}

export function CustomUserButton({ alwaysExpanded = false }: CustomUserButtonProps) {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const getInitials = () => {
    const name = user.displayName || user.email || ''
    return name.charAt(0).toUpperCase()
  }

  const displayName = user.displayName || user.email || 'Noctua user'

  if (alwaysExpanded) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900/60 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-r from-primary to-secondary text-lg font-semibold text-white">
            {getInitials()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white leading-tight truncate">{displayName}</p>
            {user.email && (
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="w-full rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:cursor-pointer hover:bg-gray-800"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 rounded-full bg-linear-to-r from-primary to-secondary flex items-center justify-center text-white font-medium hover:cursor-pointer hover:opacity-90 transition-opacity"
      >
        {getInitials()}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 left-auto min-w-[200px] w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
          <div className="p-4 border-b border-gray-700">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            {user.email && <p className="text-xs text-gray-400 mt-1 truncate">{user.email}</p>}
          </div>
          
          <button
            onClick={() => {
              signOut()
              setIsOpen(false)
            }}
            className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-700 hover:cursor-pointer transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}