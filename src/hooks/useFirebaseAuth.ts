import { useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { signInWithCustomToken } from 'firebase/auth'
import { auth } from '../firebase'

export function useFirebaseAuth() {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (isLoaded && user) {
      // Get Firebase custom token from your backend
      // You'll need to create an endpoint that generates a custom token
      // using the Firebase Admin SDK
      const getFirebaseToken = async () => {
        try {
          // This is a placeholder - you'll need to implement this
          const response = await fetch('/api/firebase-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id })
          })
          
          const { token } = await response.json()
          await signInWithCustomToken(auth, token)
        } catch (error) {
          console.error('Error signing in to Firebase:', error)
        }
      }

      getFirebaseToken()
    }
  }, [user, isLoaded])
}
