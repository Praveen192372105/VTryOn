import React, { useContext, useEffect, useState, useCallback, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { tokenStore } from "../../lib/auth/token-store"
import { clearPrivateQueryState } from "../../app/query-client"
import { authKeys } from "./query-keys"
import type { User, AuthSession } from "../../lib/api/types"
import type { AuthStatus, AuthNavigationReason, LoginCredentials, RegisterCredentials, AuthContextType } from "./types"
import { getCurrentUser, loginUser, registerUser, logoutUser } from "./api"
import { clearSelectedPersonUpload } from "../uploads"
import { clearSelectedOutfit } from "../outfits"
import { AuthContext } from "./auth-context"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>("unknown")
  const [authReason, setAuthReason] = useState<AuthNavigationReason | null>(null)
  const queryClient = useQueryClient()
  const isLoggingOutRef = useRef(false)

  const establishSession = useCallback((session: AuthSession) => {
    tokenStore.setTokens(session.tokens.access_token, session.tokens.refresh_token)
    // Seed TanStack Query cache as authoritative source of current-user data
    queryClient.setQueryData(authKeys.me(), session.user)
    setUser(session.user)
    setAuthReason(null)
    setStatus("authenticated")
  }, [queryClient])

  const clearSession = useCallback(async (reason: AuthNavigationReason | null = null) => {
    tokenStore.clearTokens()
    clearSelectedPersonUpload()
    clearSelectedOutfit()
    setUser(null)
    setAuthReason(reason)
    setStatus("unauthenticated")
    // Atomically cancel in-flight queries and purge all user-scoped caches
    await clearPrivateQueryState(queryClient)
  }, [queryClient])

  const bootstrapSession = useCallback(async () => {
    if (!tokenStore.hasValidSession()) {
      setUser(null)
      setStatus("unauthenticated")
      return
    }

    try {
      const currentUser = await queryClient.fetchQuery({
        queryKey: authKeys.me(),
        queryFn: getCurrentUser,
        staleTime: 5 * 60 * 1000,
      })
      setUser(currentUser)
      setStatus("authenticated")
    } catch {
      await clearSession(null)
    }
  }, [clearSession, queryClient])

  useEffect(() => {
    bootstrapSession()

    const handleAuthExpired = async () => {
      await clearSession("session-expired")
    }

    // Cross-tab synchronization via native storage events
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === "vtryon_access_token") {
        if (!event.newValue) {
          // Logged out in another tab
          await clearSession("signed-out")
        } else if (status !== "authenticated") {
          // Logged in in another tab
          await bootstrapSession()
        }
      }
    }

    window.addEventListener("vtryon:auth-expired", handleAuthExpired)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("vtryon:auth-expired", handleAuthExpired)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [bootstrapSession, clearSession, status])

  const login = async (credentials: LoginCredentials): Promise<AuthSession> => {
    const session = await loginUser(credentials)
    establishSession(session)
    return session
  }

  const register = async (credentials: RegisterCredentials): Promise<AuthSession> => {
    const session = await registerUser(credentials)
    establishSession(session)
    return session
  }

  const logout = async (): Promise<void> => {
    if (isLoggingOutRef.current) return
    isLoggingOutRef.current = true

    try {
      await logoutUser()
    } catch {
      // Suppress server revocation error so user is never trapped in app
    } finally {
      await clearSession("signed-out")
      isLoggingOutRef.current = false
    }
  }

  const clearAuthReason = () => {
    setAuthReason(null)
  }

  const value: AuthContextType = {
    user,
    status,
    authReason,
    isAuthenticated: status === "authenticated",
    isLoading: status === "unknown",
    login,
    register,
    logout,
    clearAuthReason,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
