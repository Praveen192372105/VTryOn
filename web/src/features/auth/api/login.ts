import { apiClient, apiRequest } from "@/lib/api/client"
import { tokenStore } from "@/lib/auth/token-store"
import { authEndpoints } from "./endpoints"
import type { ApiSuccess, AuthSession, BackendAuthResponse } from "@/lib/api/types"
import type { LoginCredentials } from "../types"

export async function loginUser(credentials: LoginCredentials): Promise<AuthSession> {
  const data = await apiRequest<BackendAuthResponse>(
    apiClient.post<ApiSuccess<BackendAuthResponse>>(authEndpoints.login, credentials)
  )

  const accessToken = data.tokens?.access_token || data.access_token
  const refreshToken = data.tokens?.refresh_token || data.refresh_token || ""

  if (accessToken) {
    tokenStore.setTokens(accessToken, refreshToken)
  }

  return {
    user: data.user,
    tokens: {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: data.token_type || data.tokens?.token_type || "bearer",
      expires_in: data.expires_in || data.tokens?.expires_in,
    },
    access_token: accessToken,
    refresh_token: refreshToken,
  }
}
