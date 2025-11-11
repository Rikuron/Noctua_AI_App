import { ProtectedRoute } from '@/components/authProvider'
import { createFileRoute } from '@tanstack/react-router'
import { Sidebar } from '@/components/sidebar'
import { PDFLibrary } from '@/components/pdfLibrary'

export const Route = createFileRoute('/repository')({
  component: PDFRepository,
})

function PDFRepository() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#1a1a1a] text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <PDFLibrary />
        </div>
      </div>
    </ProtectedRoute>
  )
}
