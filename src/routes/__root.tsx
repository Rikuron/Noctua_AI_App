import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { AuthProvider } from '../components/authProvider'

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </AuthProvider>
  ),
})