import { Navigate, Outlet, useLocation, useSearchParams } from "react-router-dom"
import { useAuth, AuthBootState } from "../features/auth"
import { ROUTES } from "./route-paths"
import { getSafeRedirectTarget } from "../lib/auth/safe-redirect"

/**
 * Client-Side Route Guards (UX Redirection)
 *
 * NOTE: Client-side route guards provide user experience redirection only.
 * They are NEVER trusted for security or authorization. Backend endpoint
 * authentication and resource ownership checks remain strictly authoritative.
 */
export function RequireAuth() {
  const { isAuthenticated, isLoading, authReason } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <AuthBootState />
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={ROUTES.auth.login} state={{ returnTo, reason: authReason }} replace />
  }

  return <Outlet />
}

export function RequireGuest() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  if (isLoading) {
    return <AuthBootState />
  }

  if (isAuthenticated) {
    const stateReturnTo = (location.state as { returnTo?: string } | null)?.returnTo
    const queryReturnTo = searchParams.get("returnTo")
    const candidate = queryReturnTo || stateReturnTo
    const safeTarget = getSafeRedirectTarget(candidate, ROUTES.app.studio)
    return <Navigate to={safeTarget} replace />
  }

  return <Outlet />
}
