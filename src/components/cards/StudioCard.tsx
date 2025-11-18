import { Plus } from 'lucide-react'

interface StudioCardProps {
  icon: React.ReactNode
  title: string
  description: string
  subtitle?: string
  onClick?: () => void
}

export function StudioCard({ 
  icon, 
  title, 
  description, 
  subtitle,
  onClick
}: StudioCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-2 hover:bg-gray-700 transition-colors cursor-pointer border border-gray-700"
    >
      <div className="flex items-start gap-2">
        <div className="text-gray-400 mt-0.5">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm mb-0.5">{title}</h4>
          {description && (
            <p className="text-xs text-gray-400">{description}</p>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{subtitle}</p>
          )}
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}