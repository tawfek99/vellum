import { Navigate, Outlet, useLocation } from 'react-router'

import { FullPageSpinner } from '@/components/ui/Spinner'
import { useSession } from '@/features/auth/useSession'

/**
 * Route guard: renders child routes only for authenticated users.
 * While the session resolves it shows a spinner (avoids an auth "flash"),
 * and unauthenticated users are redirected to `/login`.
 */
export function RequireAuth() {
  const { user, loading } = useSession()
  const location = useLocation()

  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return <Outlet />
}
