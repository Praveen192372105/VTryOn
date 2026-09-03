import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../features/auth"
import { ROUTES } from "./route-paths"
import { LoadingShell } from "../components/feedback/loading-shell"

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingShell />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} state={{ returnTo: location.pathname }} replace />
  }

  return <Outlet />
}

export function RequireGuest() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingShell />
  }

  if (isAuthenticated) {
    const returnTo = (location.state as { returnTo?: string })?.returnTo || ROUTES.studio
    return <Navigate to={returnTo} replace />
  }

  return <Outlet />
}
