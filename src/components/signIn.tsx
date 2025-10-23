import { SignIn as ClerkSignIn } from '@clerk/clerk-react'
import { useAuth } from '@clerk/clerk-react'
import { Navigate } from '@tanstack/react-router'

export function SignIn() {
  const { isSignedIn } = useAuth()

  if (isSignedIn) return <Navigate to="/" />

  return (
    <div className="flex h-screen bg-[#1a1a1a] text-white">
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="flex items-center gap-8 max-w-5xl w-full">
          {/* Left side - Logo and branding */}
          <div className="flex-1 flex flex-col items-center text-center pr-4">
            <div className="mb-8">
              <img 
                src='/logo512.png' 
                alt="Logo" 
                className="w-32 h-32 mx-auto mb-6 opacity-90"
              />
              <h1 className="text-4xl font-bold mb-4 bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                Welcome to Noctua AI
              </h1>
              <p className="text-gray-400 text-lg">
                Your intelligent AI assistant for LAV Tutors and Tutees
              </p>
            </div>
            
            {/* Feature highlights */}
            <div className="space-y-4 text-left max-w-sm">
              <div className="flex items-center gap-3 text-gray-300">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-sm">Secure authentication</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <div className="w-2 h-2 rounded-full bg-secondary"></div>
                <span className="text-sm">AI-powered assistance</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-sm">Exclusive to MSU-IIT students</span>
              </div>
            </div>
          </div>

          {/* Right side - Sign in form */}
          <div className="flex-1 flex justify-center">
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold mb-2">Sign In</h2>
                <p className="text-gray-400 text-sm">
                  Use your @g.msuiit.edu.ph email
                </p>
              </div>
              
              <ClerkSignIn 
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-linear-to-r from-primary to-secondary hover:opacity-90 transition-opacity',
                    card: 'bg-transparent shadow-none',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                    socialButtonsBlockButton: 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600 transition-colors',
                    formFieldInput: 'bg-gray-700 border-gray-600 text-white focus:border-primary focus:ring-1 focus:ring-primary',
                    formFieldLabel: 'text-gray-300',
                    footerActionLink: 'text-primary hover:text-secondary transition-colors',
                    identityPreviewText: 'text-gray-300',
                    formResendCodeLink: 'text-primary hover:text-secondary transition-colors',
                    formFieldInputShowPasswordButton: 'text-gray-400 hover:text-white',
                    formFieldSuccessText: 'text-green-400',
                    formFieldErrorText: 'text-red-400',
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}