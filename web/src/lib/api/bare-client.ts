import axios, { type InternalAxiosRequestConfig } from "axios"
import { env } from "@/config/env"
import { generateRequestId } from "./request-id"

/**
 * Minimal unauthenticated Axios client.
 * Specifically isolated for token refresh and unauthenticated bootstrapping.
 * Deliberately excludes Authorization header injection and 401 refresh interceptors
 * to structurally prevent any possibility of recursive refresh loops.
 */
export const bareClient = axios.create({
  baseURL: `${env.apiBaseUrl}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
})

// Request interceptor: attach tracing request ID only
bareClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.headers["X-Request-ID"]) {
    config.headers["X-Request-ID"] = generateRequestId()
  }
  return config
})
