import { FileText, HardDrive } from "lucide-react"
import { formatFileSize } from "../../formatters"
import type { Source } from "../../types/source"

interface StatisticsProps {
  sources: Source[]
}

export function Statistics({ sources }: StatisticsProps) {
  const counts = {
    pdf: sources.filter(source => source.type === 'pdf').length,
    docx: sources.filter(source => source.type === 'docx').length,
    txt: sources.filter(source => source.type === 'txt').length,
    md: sources.filter(source => source.type === 'md').length
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
      {/* Card 1: Total Documents */}
      <div className="bg-gray-800 p-3 sm:p-6 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-3 h-3 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-lg font-semibold">{sources.length}</h3>
            <p className="text-gray-400 text-xs sm:text-sm">Documents</p>
          </div>
        </div>
      </div>

      {/* Card 2: Storage Usage */}
      <div className="bg-gray-800 p-3 sm:p-6 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <HardDrive className="w-3 h-3 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-lg font-semibold">
              {formatFileSize(sources.reduce((total, source) => total + source.size, 0))}
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm">Storage</p>
          </div>
        </div>
      </div>

      {/* Card 3: File Types Breakdown */}
      <div className="col-span-2 sm:col-span-1 bg-gray-800 p-3 sm:p-6 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-sm sm:text-sm">
              <span className="text-gray-400">PDF: <strong className="text-white">{counts.pdf}</strong></span>
              <span className="text-gray-400">DOCX: <strong className="text-white">{counts.docx}</strong></span>
              <span className="text-gray-400">TXT: <strong className="text-white">{counts.txt}</strong></span>
              <span className="text-gray-400">MD: <strong className="text-white">{counts.md}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}