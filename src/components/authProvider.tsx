import { ClerkProvider } from '@clerk/clerk-react'
import { useAuth } from '@clerk/clerk-react'
import { Navigate } from '@tanstack/react-router'
import { FullScreenLoading } from './loadingSpinner'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  throw new Error(
    'Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file. ' +
    'You can get this key from your Clerk dashboard at https://clerk.com'
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      {children}
    </ClerkProvider>
  )
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) return <FullScreenLoading message="Authenticating..." />
  if (!isSignedIn) return <Navigate to="/sign-in" />

  // If signed in, render children (dashboard, etc)
  return <>{children}</>
}