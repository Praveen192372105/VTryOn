import { apiClient, apiRequest } from "@/lib/api/client"
import { tokenStore } from "@/lib/auth/token-store"
import { authEndpoints } from "./endpoints"

export async function logoutUser(): Promise<void> {
  const refreshToken = tokenStore.getRefreshToken()
  if (refreshToken) {
    try {
      await apiRequest<void>(
        apiClient.post(authEndpoints.logout, { refresh_token: refreshToken })
      )
    } catch {
      // Suppress network error during logout
    }
  }
  tokenStore.clearTokens()
}
