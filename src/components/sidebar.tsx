import { Link, useLocation } from '@tanstack/react-router'
import { CustomUserButton } from './userButton'

export function Sidebar() {
  const location = useLocation()
  const currentPath = location.pathname
  const isChatActive = currentPath === '/'
  const isPDFsActive = currentPath === '/repository'

  return (
    <aside className="w-64 bg-[#0f0f0f] border-r border-gray-800 flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-gray-800 flex items-center gap-3">
        <img src='/logo512.png' alt="Logo" className="w-8 h-8" />
        <span className="text-lg font-semibold text-primary">Noctua AI</span>
      </div>

      {/* Navigation and Chat History */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Navigation */}
        <div className="p-3 space-y-2">
          <Link 
            to="/"
            className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              isChatActive 
                ? 'bg-linear-to-r from-primary to-secondary' 
                : 'hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat
          </Link>
          <Link 
            to="/repository"
            className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              isPDFsActive 
                ? 'bg-linear-to-r from-primary to-secondary' 
                : 'hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF Repository
          </Link>
        </div>

        {/* Chat History - only show for chat tab */}
        {isChatActive && (
          <>
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
          </>
        )}
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <CustomUserButton />
          <span className="text-sm text-gray-300">Account</span>
        </div>
      </div>
    </aside>
  )
}