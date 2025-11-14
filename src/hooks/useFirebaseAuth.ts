import { useEffect, useState } from 'react'
import { 
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignout,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '../firebase'

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err: any) {
      setError(err.message)
      throw err
    } 
  }

  const signUp = async (email: string, password: string) => {
    try {
      setError(null)
      if (!email.endsWith('@g.msuiit.edu.ph')) {
        throw new Error('Please use your @g.msuiit.edu.ph email.')
      }
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const signInWithGoogle = async () => {
    try {
      setError(null)
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        hd: 'g.msuiit.edu.ph'
      })
      const result = await signInWithPopup(auth, provider)

      if (!result.user.email?.endsWith('@g.msuiit.edu.ph')) {
        await firebaseSignout(auth)
        throw new Error('Please use your @g.msuiit.edu.ph email.')
      }
    } catch (err:any) {
      setError(err.message)
      throw err
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      await firebaseSignout(auth)
    } catch (err:any) {
      setError(err.message)
      throw err
    }
  }

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut
  }
}
