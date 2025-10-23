import { createFileRoute, Link } from '@tanstack/react-router'
import { CustomUserButton } from '../components/userButton'

function Dashboard() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-3.5 bg-[#0f0f0f] shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo512.png" alt="Logo" className="w-10 h-10" />
          <span className="text-lg font-semibold text-primary">Noctua AI</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-lg font-medium text-primary border-b-2 border-primary">Dashboard</Link>
          <Link to="/chatbot" className="text-lg font-medium text-white hover:text-secondary transition-colors">Chatbot</Link>
          <Link to="/repository" className="text-lg font-medium text-white hover:text-secondary transition-colors">Repository</Link>
          <CustomUserButton />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 bg-[#1a1a1a]">
        <div className="max-w-2xl w-full bg-gray-800 rounded-2xl shadow-lg p-10 flex flex-col items-center border border-gray-700 mt-4 ">
          <h1 className="text-3xl font-bold mb-2 text-center text-primary">Turn your study materials into a study plan</h1>
          <p className="text-lg text-gray-300 mb-8 text-center">We'll turn your files into custom AI-powered tools to help you study for exams.</p>
          <div className="w-full border-2 border-dashed border-gray-600 rounded-xl py-12 flex flex-col items-center mb-8 bg-gray-800/50">
            <p className="text-lg font-medium mb-4 text-primary">Upload any files from Class</p>
            <button className="text-primary underline mb-4 hover:text-secondary transition-colors">Click to upload</button>
            <div className="flex flex-wrap gap-4 justify-center mb-4">
              <span className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">Powerpoints</span>
              <span className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">PDF Documents</span>
              <span className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">Audio Files</span>
              <span className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">Video Files</span>
              <span className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">Import Quizlet</span>
              <span className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">Youtube Video</span>
              <span className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">From Canvas</span>
            </div>
            <button className="text-primary text-sm hover:text-secondary transition-colors">View more upload types</button>
          </div>
          <button className="w-full py-3 bg-linear-to-r from-primary to-secondary text-white rounded-lg font-semibold shadow hover:opacity-90 transition-opacity">No Files to upload?</button>
        </div>
      </main>
    </div>
  )
}

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

export default Dashboard
