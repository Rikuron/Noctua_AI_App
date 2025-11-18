import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { Notebook } from '../../types/notebook'

interface NotebookHeaderProps {
  notebook: Notebook
  userInitial: string
  onNavigateBack: () => void
  onUpdateNotebook: (name: string) => Promise<void>
}

export function NotebookHeader({ 
  notebook, 
  onNavigateBack,
  onUpdateNotebook 
}: NotebookHeaderProps) {
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(notebook.name)
  const [savingName, setSavingName] = useState(false)
  const displayIcon = (notebook.icon && notebook.icon.trim() || '📓')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notebook) return
    setSavingName(true)
    try {
      await onUpdateNotebook(newName)
      setEditingName(false)
    } catch (err) {
      alert('Failed to update notebook name')
    } finally {
      setSavingName(false)
    }
  }

  return (
    <header className="border-b border-gray-700 px-4 lg:px-6 py-4 bg-gray-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateBack}
            className="p-1 hover:bg-gray-700 hover:cursor-pointer rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-lg">
              <span className="leading-none">{displayIcon}</span>
            </div>
            <div>
              {editingName ? (
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2 flex-wrap"
                >
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-lg text-white font-semibold focus:outline-none focus:border-blue-500"
                    disabled={savingName}
                    maxLength={64}
                    style={{ minWidth: '120px' }}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:cursor-pointer hover:bg-blue-700 text-sm transition-colors duration-200 ease-in-out"
                      disabled={savingName || !newName.trim()}
                    >Save</button>
                    <button
                      type="button"
                      className="px-2 py-1 bg-gray-700 text-white rounded hover:cursor-pointer hover:bg-gray-600 text-sm transition-colors duration-200 ease-in-out"
                      onClick={() => { setEditingName(false); setNewName(notebook.name) }}
                      disabled={savingName}
                    >Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-lg">{notebook.name}</h1>
                  <button
                    className="ml-2 px-2 py-1 bg-gray-700 text-white rounded hover:cursor-pointer hover:bg-gray-600 text-xs transition-colors duration-200 ease-in-out"
                    onClick={() => setEditingName(true)}
                  >Edit</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}