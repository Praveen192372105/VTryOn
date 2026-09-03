import axios from "axios"
import { env } from "../../config/env"
import { tokenStore } from "../auth/token-store"
import type { ApiSuccess, AuthTokens } from "./types"

let activeRefreshPromise: Promise<string> | null = null

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
      const response = await axios.post<ApiSuccess<AuthTokens>>(
        `${env.apiBaseUrl}/api/v1/auth/refresh`,
        { refresh_token: refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
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
