import { BookOpen, FileText, Clock, MoreVertical, Loader2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { formatDate, formatDateRelative } from '../../formatters'
import { useState } from 'react'
import type { Notebook } from '../../types/notebook'
import { NotebookSettingsModal } from '../ui/NotebookSettingsModal'

interface NotebookCardProps {
  notebook: Notebook
  sourceCount: number
  isDeleting?: boolean
  onDelete: () => Promise<void> | void
  onUpdate: (updates: { icon?: string; name: string; description: string }) => Promise<void>
}

export function NotebookCard({ notebook, sourceCount, isDeleting, onDelete, onUpdate }: NotebookCardProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const displayIcon = notebook.icon?.trim() ?? ''

  return (
    <div className="group relative h-full">
      <Link
        to="/notebook/$notebookId"
        params={{ notebookId: notebook.id }}
        className="block h-full rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg transition-all duration-200 hover:border-gray-600 hover:bg-gray-750 hover:shadow-xl"
      >
        <div className="flex h-full flex-col">
          <div className="mb-4 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-2xl">
              {displayIcon ? <span className="leading-none">{displayIcon}</span> : <BookOpen className="h-6 w-6 text-white" />}
            </div>
          </div>

          <h3 className="mb-2 line-clamp-1 text-lg font-semibold transition-colors group-hover:text-blue-400">
            {notebook.name}
          </h3>

          {notebook.description && (
            <p className="mb-4 line-clamp-2 text-sm text-gray-400">
              {notebook.description}
            </p>
          )}

          <div className="mt-auto flex items-end justify-between pt-4">
            <div className="flex items-center text-sm text-gray-400">
              <FileText className="mr-1.5 h-4 w-4" />
              <span>{sourceCount} {sourceCount === 1 ? 'source' : 'sources'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              <span title={formatDate(notebook.updatedAt)}>
                {formatDateRelative(notebook.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </Link>

      <div className="absolute right-4 top-4">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setSettingsOpen(true)
          }}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:cursor-pointer hover:bg-gray-700 hover:text-white"
          disabled={isDeleting}
          aria-label="Notebook menu"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
        </button>
      </div>

      <NotebookSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialIcon={notebook.icon}
        initialName={notebook.name}
        initialDescription={notebook.description}
        isDeleting={isDeleting}
        onSave={onUpdate}
        onDelete={async () => {
          await onDelete()
        }}
      />
    </div>
  )
}