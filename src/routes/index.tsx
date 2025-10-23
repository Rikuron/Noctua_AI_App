import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const { isSignedIn, isLoaded } = useAuth()
  if (!isLoaded) return null
  if (!isSignedIn) return <Navigate to="/sign-in" />
  return <Navigate to="/dashboard" />
}

export default IndexPage