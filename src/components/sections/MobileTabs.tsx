import { MessageCircle, FileText, BarChart3 } from 'lucide-react'

interface MobileTabsProps {
  activeTab: 'chat' | 'sources' | 'studio'
  onTabChange: (tab: 'chat' | 'sources' | 'studio') => void
}

export function MobileTabs({ activeTab, onTabChange }: MobileTabsProps) {
  return (
    <div className="lg:hidden flex border-b border-gray-700 bg-gray-900">
      <button 
        onClick={() => onTabChange('chat')}
        className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'chat' 
            ? 'border-blue-500 text-blue-500' 
            : 'border-transparent text-gray-400 hover:text-white'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Chat
        </div>
      </button>
      <button 
        onClick={() => onTabChange('sources')}
        className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'sources' 
            ? 'border-blue-500 text-blue-500' 
            : 'border-transparent text-gray-400 hover:text-white'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <FileText className="w-4 h-4" />
          Sources
        </div>
      </button>
      <button 
        onClick={() => onTabChange('studio')}
        className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'studio' 
            ? 'border-blue-500 text-blue-500' 
            : 'border-transparent text-gray-400 hover:text-white'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Studio
        </div>
      </button>
    </div>
  )
}