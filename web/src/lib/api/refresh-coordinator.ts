import { bareClient } from "./bare-client"
import { tokenStore } from "@/lib/auth/token-store"
import type { ApiSuccess, AuthTokens } from "./types"

let activeRefreshPromise: Promise<string> | null = null

/**
 * Coordinates single-flight access token refreshing across concurrent 401 callers.
 * If multiple requests receive 401 simultaneously, they all await this single promise.
 * Rotated tokens are atomically updated in tokenStore before callers resume.
 */
export async function coordinateTokenRefresh(): Promise<string> {
  if (activeRefreshPromise) {
    return activeRefreshPromise
  }

  const refreshToken = tokenStore.getRefreshToken()
  if (!refreshToken) {
    tokenStore.clearTokens()
    throw new Error("No refresh token available")
  }

  activeRefreshPromise = (async () => {
    try {
      const response = await bareClient.post<ApiSuccess<AuthTokens>>(
        "/auth/refresh",
        { refresh_token: refreshToken }
      )

      const newTokens = response.data.data
      tokenStore.setTokens(newTokens.access_token, newTokens.refresh_token)
      return newTokens.access_token
    } catch (error) {
      tokenStore.clearTokens()
      throw error
    } finally {
      activeRefreshPromise = null
    }
  })()

  return activeRefreshPromise
}

export function isRefreshInProgress(): boolean {
  return activeRefreshPromise !== null
}
