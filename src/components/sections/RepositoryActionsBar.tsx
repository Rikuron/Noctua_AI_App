import { Search, Plus, Filter, ArrowUpDown } from 'lucide-react'

interface RepositoryActionsBarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterType: 'all' | 'pdf' | 'docx' | 'txt' | 'md'
  setFilterType: (type: 'all' | 'pdf' | 'docx' | 'txt' | 'md') => void
  sortOrder: 'asc' | 'desc'
  setSortOrder: (order: 'asc' | 'desc') => void
  onUpload: () => void
}

export function RepositoryActionsBar({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  sortOrder,
  setSortOrder,
  onUpload
}: RepositoryActionsBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
        {/* Search Input - Occupies full width on mobile */}
        <div className="relative w-full sm:w-auto sm:flex-1">
          <Search className="w-3 h-3 sm:w-4 sm:h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white text-sm w-full sm:w-64"
          />
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          {/* Type Filter */}
          <div className="relative flex-1 sm:flex-none">
            <Filter className="w-3 h-3 sm:w-4 sm:h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="pl-8 pr-8 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white text-sm appearance-none w-full sm:w-auto cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
              <option value="txt">TXT</option>
              <option value="md">Markdown</option>
            </select>
          </div>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors text-sm text-white min-w-[100px]"
          >
            <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>
      </div>

      <button
        onClick={onUpload}
        className="flex items-center justify-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:py-2 rounded-lg transition-colors text-sm w-full sm:w-auto"
      >
        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
        <span>Add Document</span>
      </button>
    </div>
  )
}