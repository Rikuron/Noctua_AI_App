import { useState } from 'react'
import { useAuth } from './authProvider'
import { Navigate } from '@tanstack/react-router'

export function SignIn() {
  const { user, error, signIn, signUp, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) return <Navigate to="/" />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setIsSubmitting(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
    } catch (err: any) {
      setLocalError(err.message || 'Failed to sign in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLocalError(null)
    setIsSubmitting(true)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      setLocalError(err.message || 'Failed to sign in with Google. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#1a1a1a] text-white">
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 max-w-5xl w-full">
          {/* Left side - Logo and branding (hidden on mobile, shown on desktop) */}
          <div className="hidden lg:flex flex-1 flex-col items-center text-center pr-4">
            <div className="mb-8">
              <img 
                src='/logo512.png' 
                alt="Logo" 
                className="w-32 h-32 mx-auto mb-6 opacity-90"
              />
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
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

          {/* Mobile-only header */}
          <div className="lg:hidden text-center mb-6">
            <img 
              src='/logo512.png' 
              alt="Logo" 
              className="w-20 h-20 mx-auto mb-4 opacity-90"
            />
            <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Noctua AI
            </h1>
            <p className="text-gray-400 text-sm">
              Your intelligent AI assistant
            </p>
          </div>

          {/* Right side - Sign in form */}
          <div className="flex-1 flex justify-center w-full max-w-md">
            <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-700 shadow-2xl w-full">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </h2>
                <p className="text-gray-400 text-sm">
                  Use your @g.msuiit.edu.ph email
                </p>
              </div>

              {(localError || error) && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {localError || error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.name@g.msuiit.edu.ph"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-base"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 cursor-pointer bg-gradient-to-r from-primary to-secondary rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-base"
                >
                  {isSubmitting ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-800 text-gray-400">Or continue with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-3 bg-gray-700 cursor-pointer hover:bg-gray-600 border border-gray-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>

              <div className="mt-6 text-center text-sm text-gray-400">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary cursor-pointer hover:text-secondary transition-colors font-medium"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}