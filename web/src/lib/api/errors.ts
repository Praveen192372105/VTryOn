import axios from "axios"
import type { ApiErrorPayload } from "./types"

export class AppApiError extends Error {
  readonly code: string
  readonly status?: number
  readonly requestId?: string
  readonly details?: unknown

  constructor({
    message,
    code = "UNKNOWN_ERROR",
    status,
    requestId,
    details,
  }: {
    message: string
    code?: string
    status?: number
    requestId?: string
    details?: unknown
  }) {
    super(message)
    this.name = "AppApiError"
    this.code = code
    this.status = status
    this.requestId = requestId
    this.details = details
  }
}

export const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Email or password is incorrect.",
  EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
  NOT_AUTHENTICATED: "Please sign in to continue.",
  TOKEN_EXPIRED: "Your session has expired. Please sign in again.",
  UPLOAD_TOO_LARGE: "This image is larger than the allowed upload size.",
  INVALID_PERSON_IMAGE: "We couldn't use this photo. Please upload a clear person photo.",
  INVALID_IMAGE_FORMAT: "Unsupported image format. Please use JPG, PNG, or WebP.",
  MODEL_UNAVAILABLE: "Try-on engine is temporarily busy. Please try again shortly.",
  RESOURCE_NOT_FOUND: "The requested item was not found.",
  FORBIDDEN: "You do not have permission to access this resource.",
  RATE_LIMIT_EXCEEDED: "Too many requests. Please wait a moment before trying again.",
  NETWORK_ERROR: "Unable to connect to the server. Please check your internet connection.",
  TIMEOUT_ERROR: "The request took too long to complete. Please try again.",
}

export function getHumanErrorMessage(code: string, fallbackMessage?: string): string {
  return ERROR_MESSAGES[code] || fallbackMessage || "An unexpected error occurred. Please try again."
}

export function normalizeApiError(error: unknown): AppApiError {
  if (error instanceof AppApiError) {
    return error
  }

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        return new AppApiError({
          code: "TIMEOUT_ERROR",
          message: getHumanErrorMessage("TIMEOUT_ERROR"),
        })
      }
      return new AppApiError({
        code: "NETWORK_ERROR",
        message: getHumanErrorMessage("NETWORK_ERROR"),
      })
    }

    const data = error.response.data as Partial<ApiErrorPayload> | undefined
    const status = error.response.status

    if (data?.error) {
      const code = data.error.code || `HTTP_${status}`
      const userMessage = getHumanErrorMessage(code, data.error.message)
      return new AppApiError({
        code,
        message: userMessage,
        status,
        requestId: data.request_id,
        details: data.error.details,
      })
    }

    return new AppApiError({
      code: `HTTP_${status}`,
      message: `Request failed with status ${status}`,
      status,
    })
  }

  if (error instanceof Error) {
    return new AppApiError({
      code: "CLIENT_ERROR",
      message: error.message,
    })
  }

  return new AppApiError({
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred.",
  })
}
