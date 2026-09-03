import axios, { type InternalAxiosRequestConfig } from "axios"
import { env } from "../../config/env"
import { tokenStore } from "../auth/token-store"
import { coordinateTokenRefresh } from "./refresh-coordinator"
import { generateRequestId } from "./request-id"
import { normalizeApiError } from "./errors"
import type { ApiSuccess } from "./types"

export const apiClient = axios.create({
  baseURL: `${env.apiBaseUrl}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
})

// Request interceptor: attach bearer token and request ID
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.getAccessToken()
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (!config.headers["X-Request-ID"]) {
      config.headers["X-Request-ID"] = generateRequestId()
    }

    return config
  },
  (error) => Promise.reject(normalizeApiError(error))
)

// Response interceptor: coordinate 401 refresh & normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (!originalRequest) {
      return Promise.reject(normalizeApiError(error))
    }

    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh")

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true
      try {
        const newAccessToken = await coordinateTokenRefresh()
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed: session revoked
        tokenStore.clearTokens()
        window.dispatchEvent(new CustomEvent("vtryon:auth-expired"))
        return Promise.reject(normalizeApiError(refreshError))
      }
    }

    return Promise.reject(normalizeApiError(error))
  }
)

/**
 * Convenient typed wrapper to unwrap ApiSuccess envelope data directly
 */
export async function apiRequest<T>(requestPromise: Promise<{ data: ApiSuccess<T> }>): Promise<T> {
  try {
    const response = await requestPromise
    return response.data.data
  } catch (error) {
    throw normalizeApiError(error)
  }
}
