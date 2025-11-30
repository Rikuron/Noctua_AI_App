import { BarChart3, Brain, StickyNote, HelpCircle } from 'lucide-react'
import { StudioCard } from '../cards/StudioCard'

interface StudioSidebarProps {
  activeTab: 'chat' | 'sources' | 'studio'
  onShowSummaryModal: () => void
  onShowPresentationModal: () => void
}

export function StudioSidebar({ activeTab, onShowSummaryModal, onShowPresentationModal }: StudioSidebarProps) {
  return (
    <div className={`${
      activeTab === 'studio' ? 'flex' : 'hidden'
    } lg:flex w-full lg:w-80 border-l border-gray-700 bg-gray-900 flex-col overflow-hidden`}>
      {/* Header - Fixed */}
      <div className="px-4 py-3 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          <span className="font-medium">Studio</span>
        </div>
      </div>

      {/* Studio Cards - Scrollable */}
      <div className="flex-1 p-3 space-y-2 min-h-0 md:overflow-y-auto">
        <StudioCard 
          icon={<Brain className="w-4 h-4" />}
          title="Summary"
          description="Generate a summary of your sources"
          onClick={onShowSummaryModal}
        />
        
        <StudioCard 
          icon={<BarChart3 className="w-4 h-4" />}
          title="Presentations"
          description="Create presentations from your content"
          onClick={onShowPresentationModal}
        />
        
        <StudioCard 
          icon={<StickyNote className="w-4 h-4" />}
          title="Flashcards"
          description="Generate study flashcards"
        />
        
        <StudioCard 
          icon={<HelpCircle className="w-4 h-4" />}
          title="Quiz"
          description="Create quizzes from your material"
        />
      </div>

    </div>
  )
}