import { useEffect, useState } from 'react'
import { BookOpen, Loader2, Trash2 } from 'lucide-react'
import { Modal } from './Modal'

interface NotebookSettingsModalProps {
  isOpen: boolean
  initialIcon?: string
  initialName: string
  initialDescription?: string
  isDeleting?: boolean
  onClose: () => void
  onSave: (values: { icon?: string; name: string; description: string }) => Promise<void>
  onDelete: () => Promise<void>
}

export function NotebookSettingsModal({
  isOpen,
  initialIcon,
  initialName,
  initialDescription,
  isDeleting,
  onClose,
  onSave,
  onDelete,
}: NotebookSettingsModalProps) {
  const [icon, setIcon] = useState(initialIcon ?? '📓')
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setIcon(initialIcon ?? '📓')
    setName(initialName)
    setDescription(initialDescription ?? '')
    setError(null)
    setSaving(false)
    setDeleting(false)
  }, [isOpen, initialIcon, initialName, initialDescription])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        icon: icon.trim() || '📓',
        name: name.trim(),
        description: description.trim(),
      })
      onClose()
    } catch (err) {
      console.error('Failed to save notebook', err)
      setError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this notebook and all of its data?')) return
    setDeleting(true)
    setError(null)
    try {
      await onDelete()
      onClose()
    } catch (err) {
      console.error('Failed to delete notebook', err)
      setError('Failed to delete notebook. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notebook settings"
      subtitle="Update the icon, name, description, or delete this notebook."
      icon={<BookOpen className="h-6 w-6 text-white" />}
      size="sm"
      headerClassName="gap-4"
      iconWrapperClassName="w-17 h-12 rounded-xl bg-blue-500 flex items-center justify-center"
      titleWrapperClassName="space-y-1 text-base leading-tight"
    >
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-4 items-end">
            <label className="basis-[33%] text-sm font-medium text-gray-300">
              Icon (single character or emoji)
              <input
                type="text"
                maxLength={2}
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="basis-[67%] text-sm font-medium text-gray-300">
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                required
              />
            </label>
          </div>

          <label className="text-sm font-medium text-gray-300">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="mt-2 w-full resize-none rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 min-w-[140px] rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:cursor-pointer hover:bg-red-500/10 disabled:opacity-60"
            disabled={saving || deleting || isDeleting}
          >
            {deleting || isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-w-[120px] rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200 transition-colors hover:cursor-pointer hover:bg-gray-700 disabled:opacity-60"
            disabled={saving || deleting || isDeleting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="flex-1 min-w-[140px] rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:cursor-pointer hover:bg-blue-700 disabled:bg-gray-600"
            disabled={saving || deleting || isDeleting}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}