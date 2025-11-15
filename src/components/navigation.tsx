import { Link } from '@tanstack/react-router'
import { CustomUserButton } from './userButton'
import { Brain } from 'lucide-react'

interface NavigationProps {
  currentPage?: 'notebooks' | 'repository' | 'admin'
}

export function Navigation({ currentPage }: NavigationProps) {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-[#0f0f0f] border-b border-gray-800">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent">
          <img src="/logo192.png" alt="Noctua AI Logo" className="w-8 h-8 object-contain" />
        </div>
        <span className="text-xl font-semibold text-white">Noctua AI</span>
      </div>
      
      <div className="flex items-center gap-8">
        <Link 
          to="/" 
          className={`text-lg font-medium transition-colors hover:text-blue-400 ${
            currentPage === 'notebooks' 
              ? 'text-blue-400 border-b-2 border-blue-400 pb-1' 
              : 'text-gray-300'
          }`}
        >
          Notebooks
        </Link>
        <Link 
          to="/repository" 
          className={`text-lg font-medium transition-colors hover:text-blue-400 ${
            currentPage === 'repository' 
              ? 'text-blue-400 border-b-2 border-blue-400 pb-1' 
              : 'text-gray-300'
          }`}
        >
          Material Repository
        </Link>
        <Link 
          to="/test" 
          className={`text-lg font-medium transition-colors hover:text-blue-400 text-gray-300`}
        >
          Gemini API Test
        </Link>
        <CustomUserButton />
      </div>
    </nav>
  )
}