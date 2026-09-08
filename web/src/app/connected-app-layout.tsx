import { AppLayout } from "../components/layout"
import { useAuth } from "../features/auth"

export function ConnectedAppLayout() {
  const { user, logout } = useAuth()
  return <AppLayout user={user} onLogout={logout} />
}
