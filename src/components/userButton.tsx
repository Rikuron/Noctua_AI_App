import { useState, useRef, useEffect } from 'react'
import { useAuth } from './authProvider'

export function CustomUserButton() {
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
    const email = user.email || ''
    return email.charAt(0).toUpperCase()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-linear-to-r from-primary to-secondary flex items-center justify-center text-white font-medium hover:opacity-90 transition-opacity"
      >
        {getInitials()}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 left-auto min-w-[200px] w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
          <div className="p-4 border-b border-gray-700">
            <p className="text-sm font-medium text-white truncate">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">MSU-IIT Student</p>
          </div>
          
          <button
            onClick={() => {
              signOut()
              setIsOpen(false)
            }}
            className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}