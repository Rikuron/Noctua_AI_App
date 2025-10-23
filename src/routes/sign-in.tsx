import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '../components/signIn'

export const Route = createFileRoute('/sign-in')({
  component: SignIn,
})
