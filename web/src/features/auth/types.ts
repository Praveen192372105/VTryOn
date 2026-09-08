import type { User, AuthTokens, AuthSession } from "../../lib/api/types"

export type AuthStatus = "unknown" | "authenticated" | "unauthenticated"

export type AuthNavigationReason = "session-expired" | "signed-out"

export interface AuthState {
  status: AuthStatus
  user: User | null
  tokens: AuthTokens | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
}

export interface AuthContextType {
  user: User | null
  status: AuthStatus
  authReason: AuthNavigationReason | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<AuthSession>
  register: (credentials: RegisterCredentials) => Promise<AuthSession>
  logout: () => Promise<void>
  clearAuthReason: () => void
}
