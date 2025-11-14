import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ProtectedRoute } from '../components/authProvider'
import { CustomUserButton } from '../components/userButton'
import { Search, Filter, BookOpen, FileText, Video, Headphones, type LucideIcon } from 'lucide-react'

export const Route = createFileRoute('/repository')({
  component: MaterialRepository,
})

interface Material {
  id: number
  title: string
  type: string
  subject: string
  uploadedBy: string
  uploadDate: string
  size: string
  icon: LucideIcon
}

function MaterialRepository() {
  const [activeTab, setActiveTab] = useState('repository')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)

  // Mock data for materials - in real app this would come from Firebase/API
  const materials = [
    {
      id: 1,
      title: "Introduction to Machine Learning",
      type: "PDF",
      subject: "Computer Science",
      uploadedBy: "Dr. Smith",
      uploadDate: "2024-10-20",
      size: "2.5 MB",
      icon: FileText
    },
    {
      id: 2,
      title: "Calculus Fundamentals",
      type: "Video",
      subject: "Mathematics",
      uploadedBy: "Prof. Johnson",
      uploadDate: "2024-10-18",
      size: "45.2 MB",
      icon: Video
    },
    {
      id: 3,
      title: "Physics Lecture Notes",
      type: "Audio",
      subject: "Physics",
      uploadedBy: "Dr. Brown",
      uploadDate: "2024-10-15",
      size: "12.8 MB",
      icon: Headphones
    }
  ]

  const filteredMaterials = materials.filter(material =>
    material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs = [
    { id: 'repository', label: 'Material Repository', icon: BookOpen },
    { id: 'assessments', label: 'Assessments', icon: FileText },
    { id: 'shared', label: 'Shared with Me', icon: BookOpen }
  ]

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-3.5 bg-[#0f0f0f] shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo512.png" alt="Logo" className="w-10 h-10" />
          <span className="text-lg font-semibold text-primary">Noctua AI</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-lg font-medium text-white hover:text-secondary transition-colors">Dashboard</Link>
          <Link to="/chatbot" className="text-lg font-medium text-white hover:text-secondary transition-colors">Chatbot</Link>
          <Link to="/repository" className="text-lg font-medium text-primary border-b-2 border-primary">Repository</Link>
          <CustomUserButton />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, User!</h1>
          <p className="text-gray-400">Access your study materials and track your progress</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors">
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex gap-6">
          {/* Materials List */}
          <div className="flex-1">
            {activeTab === 'repository' && (
              <>
                {filteredMaterials.length > 0 ? (
                  <div className="space-y-3">
                    {filteredMaterials.map((material) => {
                      const IconComponent = material.icon
                      return (
                        <div
                          key={material.id}
                          onClick={() => setSelectedMaterial(material)}
                          className={`p-4 bg-gray-800 rounded-lg border cursor-pointer transition-colors hover:bg-gray-700 ${
                            selectedMaterial?.id === material.id ? 'border-primary' : 'border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <IconComponent className="w-6 h-6 text-primary" />
                            <div className="flex-1">
                              <h3 className="font-semibold">{material.title}</h3>
                              <p className="text-sm text-gray-400">
                                {material.subject} • By {material.uploadedBy}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{material.type}</p>
                              <p className="text-xs text-gray-400">{material.size}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 mt-12">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No materials found.</p>
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'assessments' && (
              <div className="text-center text-gray-400 mt-12">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No assessments available.</p>
              </div>
            )}
            
            {activeTab === 'shared' && (
              <div className="text-center text-gray-400 mt-12">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No shared materials.</p>
              </div>
            )}
          </div>

          {/* Material Details Panel */}
          <div className="w-80 bg-gray-800 rounded-lg p-6">
            {selectedMaterial ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <selectedMaterial.icon className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">{selectedMaterial.title}</h3>
                    <p className="text-sm text-gray-400">{selectedMaterial.type}</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="text-sm text-gray-400">Subject</label>
                    <p className="font-medium">{selectedMaterial.subject}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Uploaded by</label>
                    <p className="font-medium">{selectedMaterial.uploadedBy}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Date</label>
                    <p className="font-medium">{selectedMaterial.uploadDate}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Size</label>
                    <p className="font-medium">{selectedMaterial.size}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button className="w-full py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                    Download
                  </button>
                  <button className="w-full py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors">
                    Preview
                  </button>
                  <button className="w-full py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors">
                    Share
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a material to view details</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}
  )
}
>>>>>>> rikuron/master
