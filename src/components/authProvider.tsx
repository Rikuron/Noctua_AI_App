import { createContext, useContext, type ReactNode } from 'react'
import { Navigate } from '@tanstack/react-router'
import { useFirebaseAuth } from '../hooks/useFirebaseAuth'
import { AppLoader } from './ui/AppLoader'
import type { User } from 'firebase/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useFirebaseAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <AppLoader fullscreen label="Authenticating..." />
  if (!user) return <Navigate to="/sign-in" />
  return <>{children}</>
}