import { Link } from '@tanstack/react-router'
import { CustomUserButton } from './ui/CustomUserButton'
import { BookOpen, Library, Menu, X } from 'lucide-react'
import { useState } from 'react'

interface NavigationProps {
  currentPage?: 'notebooks' | 'repository' | 'admin'
}

export function Navigation({ currentPage }: NavigationProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <>
      {/* Main Header */}
      <nav className="flex items-center justify-between px-4 py-4 bg-[#0f0f0f] border-b border-gray-800 md:px-6">
        {/* Left side - Logo and Mobile Menu Button */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-300 hover:text-white transition-colors md:hidden"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent">
              <img 
                src="/logo192.png" 
                alt="Noctua AI Logo" 
                className="w-8 h-8 object-contain" 
              />
            </div>
            <span className="text-xl font-semibold text-white">Noctua AI</span>
          </div>
        </div>

        {/* Right side - Desktop Navigation Links and User Button */}
        <div className="flex items-center gap-8">
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className={`flex items-center gap-2 text-lg font-medium transition-colors hover:text-blue-400 ${
                currentPage === 'notebooks' 
                  ? 'text-blue-400 border-b-2 border-blue-400 pb-1' 
                  : 'text-gray-300'
              }`}
            >
              <BookOpen size={20} />
              Notebooks
            </Link>
            <Link 
              to="/repository" 
              className={`flex items-center gap-2 text-lg font-medium transition-colors hover:text-blue-400 ${
                currentPage === 'repository' 
                  ? 'text-blue-400 border-b-2 border-blue-400 pb-1' 
                  : 'text-gray-300'
              }`}
            >
              <Library size={20} />
              Material Repository
            </Link>
          </div>

          {/* User Button */}
          <div className="hidden md:block">
            <CustomUserButton />
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setIsSidebarOpen(false)}
        />
        
        {/* Sidebar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-80 bg-[#0f0f0f] border-r border-gray-800 shadow-lg transform transition-transform duration-300 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent">
                <img 
                  src="/logo192.png" 
                  alt="Noctua AI Logo" 
                  className="w-8 h-8 object-contain" 
                />
              </div>
              <span className="text-xl font-semibold text-white">Noctua AI</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-2">
            <Link 
              to="/" 
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPage === 'notebooks' 
                  ? 'text-blue-400 bg-blue-400/10 border-l-2 border-blue-400' 
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <BookOpen size={20} />
              <span className="font-medium">Notebooks</span>
            </Link>
            
            <Link 
              to="/repository" 
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPage === 'repository' 
                  ? 'text-blue-400 bg-blue-400/10 border-l-2 border-blue-400' 
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Library size={20} />
              <span className="font-medium">Material Repository</span>
            </Link>
          </div>

          {/* User Button in Sidebar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
            <CustomUserButton alwaysExpanded />
          </div>
        </div>
      </div>
    </>
  )
}