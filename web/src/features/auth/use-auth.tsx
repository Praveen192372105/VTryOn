import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { tokenStore } from "../../lib/auth/token-store"
import type { User, AuthSession } from "../../lib/api/types"
import type { AuthStatus, LoginCredentials, RegisterCredentials, AuthContextType } from "./types"
import { getCurrentUser, loginUser, registerUser, logoutUser } from "./api"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>("unknown")
  const queryClient = useQueryClient()

  const bootstrapSession = useCallback(async () => {
    if (!tokenStore.hasValidSession()) {
      setUser(null)
      setStatus("unauthenticated")
      return
    }

    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setStatus("authenticated")
    } catch {
      tokenStore.clearTokens()
      setUser(null)
      setStatus("unauthenticated")
    }
  }, [])

  useEffect(() => {
    bootstrapSession()

    const handleAuthExpired = () => {
      tokenStore.clearTokens()
      setUser(null)
      setStatus("unauthenticated")
      queryClient.clear()
    }

    window.addEventListener("vtryon:auth-expired", handleAuthExpired)
    return () => {
      window.removeEventListener("vtryon:auth-expired", handleAuthExpired)
    }
  }, [bootstrapSession, queryClient])

  const login = async (credentials: LoginCredentials): Promise<AuthSession> => {
    const session = await loginUser(credentials)
    setUser(session.user)
    setStatus("authenticated")
    return session
  }

  const register = async (credentials: RegisterCredentials): Promise<AuthSession> => {
    const session = await registerUser(credentials)
    setUser(session.user)
    setStatus("authenticated")
    return session
  }

  const logout = async (): Promise<void> => {
    try {
      await logoutUser()
    } finally {
      tokenStore.clearTokens()
      setUser(null)
      setStatus("unauthenticated")
      queryClient.clear()
    }
  }

  const value: AuthContextType = {
    user,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "unknown",
    login,
    register,
    logout,
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
