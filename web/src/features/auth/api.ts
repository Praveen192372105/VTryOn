import { apiClient, apiRequest } from "../../lib/api/client"
import { tokenStore } from "../../lib/auth/token-store"
import type { ApiSuccess, User, AuthSession } from "../../lib/api/types"
import type { LoginCredentials, RegisterCredentials } from "./types"

export async function loginUser(credentials: LoginCredentials): Promise<AuthSession> {
  const data = await apiRequest<AuthSession>(
    apiClient.post<ApiSuccess<AuthSession>>("/auth/login", credentials)
  )
  tokenStore.setTokens(data.tokens.access_token, data.tokens.refresh_token)
  return data
}

export async function registerUser(credentials: RegisterCredentials): Promise<AuthSession> {
  const data = await apiRequest<AuthSession>(
    apiClient.post<ApiSuccess<AuthSession>>("/auth/register", credentials)
  )
  tokenStore.setTokens(data.tokens.access_token, data.tokens.refresh_token)
  return data
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>(apiClient.get<ApiSuccess<User>>("/users/me"))
}

export async function logoutUser(): Promise<void> {
  const refreshToken = tokenStore.getRefreshToken()
  if (refreshToken) {
    try {
      await apiClient.post("/auth/logout", { refresh_token: refreshToken })
    } catch {
      // Suppress network error during logout
    }
  }
  tokenStore.clearTokens()
}
