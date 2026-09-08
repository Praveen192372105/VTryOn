import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from "axios"
import { env } from "@/config/env"
import { tokenStore } from "@/lib/auth/token-store"
import { coordinateTokenRefresh } from "./refresh-coordinator"
import { generateRequestId } from "./request-id"
import { normalizeApiError } from "./errors"
import type { ApiSuccess } from "./types"

export interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
  skipAuth?: boolean
  skipRefresh?: boolean
}

/**
 * Single canonical HTTP client for all authenticated and feature API requests.
 * Uses centralized base URL with V1 prefix (/api/v1).
 */
export const apiClient = axios.create({
  baseURL: `${env.apiBaseUrl}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
})

// Request interceptor: attach bearer token and tracing request ID
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const customConfig = config as CustomRequestConfig
    if (!customConfig.skipAuth) {
      const token = tokenStore.getAccessToken()
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    if (!config.headers["X-Request-ID"]) {
      config.headers["X-Request-ID"] = generateRequestId()
    }

    // When sending FormData, remove Content-Type header so the browser/Axios
    // sets multipart/form-data with the dynamic boundary string
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"]
      if (typeof config.headers.delete === "function") {
        config.headers.delete("Content-Type")
      }
    }

    return config
  },
  (error) => Promise.reject(normalizeApiError(error))
)

// Response interceptor: single-flight 401 refresh, blob error parsing & error normalization
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If a blob request failed with a JSON error payload, parse text into structured JSON
    if (
      error.response?.data instanceof Blob &&
      (error.response.data.type?.includes("application/json") ||
        error.response.headers?.["content-type"]?.includes("application/json"))
    ) {
      try {
        const text = await error.response.data.text()
        error.response.data = JSON.parse(text)
      } catch {
        // Fall back to original blob
      }
    }

    const originalRequest = error.config as CustomRequestConfig | undefined

    if (!originalRequest) {
      return Promise.reject(normalizeApiError(error))
    }

    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/logout")

    // Handle 401 refresh on authenticated non-auth requests (max 1 replay)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.skipRefresh &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true
      try {
        const newAccessToken = await coordinateTokenRefresh()
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed: session revoked/expired
        tokenStore.clearTokens()
        window.dispatchEvent(new CustomEvent("vtryon:auth-expired"))
        return Promise.reject(normalizeApiError(refreshError))
      }
    }

    return Promise.reject(normalizeApiError(error))
  }
)

/**
 * Convenient typed wrapper to unwrap ApiSuccess envelope data directly,
 * with safe handling for 204 No Content responses.
 */
export async function apiRequest<T>(requestPromise: Promise<AxiosResponse<ApiSuccess<T> | T>>): Promise<T> {
  try {
    const response = await requestPromise
    if (response.status === 204 || !response.data) {
      return undefined as unknown as T
    }

    if (
      typeof response.data === "object" &&
      response.data !== null &&
      "success" in response.data &&
      "data" in response.data
    ) {
      return (response.data as ApiSuccess<T>).data
    }

    return response.data as T
  } catch (error) {
    throw normalizeApiError(error)
  }
}
