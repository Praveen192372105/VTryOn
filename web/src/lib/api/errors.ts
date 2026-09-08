import axios from "axios"
import type { ApiErrorPayload } from "./types"

export interface AppApiErrorOptions {
  message: string
  code?: string
  status?: number
  requestId?: string
  fieldErrors?: Record<string, string[]>
  retryAfterSeconds?: number
  details?: unknown
}

export class AppApiError extends Error {
  readonly code: string
  readonly status: number
  readonly requestId?: string
  readonly fieldErrors?: Record<string, string[]>
  readonly retryAfterSeconds?: number
  readonly details?: unknown

  constructor({
    message,
    code = "UNKNOWN_ERROR",
    status = 0,
    requestId,
    fieldErrors,
    retryAfterSeconds,
    details,
  }: AppApiErrorOptions) {
    super(message)
    this.name = "AppApiError"
    this.code = code
    this.status = status
    this.requestId = requestId
    this.fieldErrors = fieldErrors
    this.retryAfterSeconds = retryAfterSeconds
    this.details = details
  }
}

export const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Email or password is incorrect.",
  EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
  EMAIL_ALREADY_REGISTERED: "An account with this email already exists.",
  NOT_AUTHENTICATED: "Please sign in to continue.",
  TOKEN_EXPIRED: "Your session has expired. Please sign in again.",
  UPLOAD_TOO_LARGE: "This image exceeds the 12 MB upload limit. Please select a smaller file.",
  IMAGE_TOO_LARGE: "This image exceeds the 12 MB upload limit. Please select a smaller file.",
  UNSUPPORTED_IMAGE_TYPE: "This image format isn't supported. Choose a JPEG, PNG or WebP image.",
  INVALID_IMAGE: "We couldn't read this image. Choose another JPEG, PNG or WebP file.",
  IMAGE_DIMENSIONS_INVALID: "Image dimensions are outside the acceptable limits (256×256 to 8192×8192 pixels).",
  IMAGE_PIXEL_LIMIT_EXCEEDED: "Image total resolution exceeds the maximum allowed limit of 40 megapixels.",
  ANIMATED_IMAGE_NOT_SUPPORTED: "Animated images are not supported for person try-on.",
  UPLOAD_NOT_FOUND: "This photo could not be found.",
  UPLOAD_IN_USE: "This photo is currently being used by a try-on and can't be deleted yet.",
  UPLOAD_REQUIRED: "An image file is required.",
  EMPTY_UPLOAD: "The selected image file is empty.",
  UPLOAD_STORAGE_FAILED: "Photo uploads are temporarily unavailable. Please try again shortly.",
  UPLOAD_PERSISTENCE_FAILED: "Failed to save photo metadata. Please try again shortly.",
  INVALID_PERSON_IMAGE: "We couldn't use this photo. Please upload a clear person photo.",
  INVALID_IMAGE_FORMAT: "Unsupported image format. Please use JPG, PNG, or WebP.",
  OUTFIT_NOT_FOUND: "The requested outfit could not be found.",
  TRYON_NOT_FOUND: "This try-on could not be found.",
  TRYON_JOB_NOT_FOUND: "This try-on could not be found.",
  TRYON_JOB_IN_PROGRESS: "This try-on is still being created and can't be deleted yet.",
  TRYON_JOB_ACTIVE: "A try-on is already in progress. Please wait for it to complete.",
  TRYON_INVALID_STATE: "This try-on cannot be modified in its current state.",
  RESOURCE_CONFLICT: "This action conflicts with the current state of the item.",
  RESULT_NOT_FOUND: "The generated result for this try-on is no longer available.",
  TRYON_CAPACITY_LIMIT: "Virtual try-on servers are currently at capacity. Please try again shortly.",
  TRYON_CAPACITY_UNAVAILABLE: "Virtual try-on service is temporarily unavailable. Please check back soon.",
  MODEL_UNAVAILABLE: "Try-on engine is temporarily busy. Please try again shortly.",
  RESOURCE_NOT_FOUND: "The requested item was not found.",
  FORBIDDEN: "You do not have permission to access this resource.",
  RATE_LIMIT_EXCEEDED: "You've made several requests recently. Wait a moment and try again.",
  NETWORK_ERROR: "We couldn't reach V Try-On. Please check your internet connection.",
  TIMEOUT_ERROR: "The request took too long to complete. Please try again.",
  SERVICE_UNAVAILABLE: "Virtual try-on services are temporarily unavailable. Please try again shortly.",
  VALIDATION_ERROR: "Please check your inputs and try again.",
}

export function getHumanErrorMessage(code: string, fallbackMessage?: string): string {
  return ERROR_MESSAGES[code] || fallbackMessage || "An unexpected error occurred. Please try again."
}

/**
 * Normalizes raw validation error details into a structured fieldErrors map.
 * Supports both array format (FastAPI/Pydantic) and object dictionary format.
 * Cleans prefix paths (body., query., path.) and scrubs any sensitive input values.
 */
export function normalizeValidationDetails(rawDetails: unknown): Record<string, string[]> | undefined {
  if (!rawDetails || typeof rawDetails !== "object") {
    return undefined
  }

  const fieldErrors: Record<string, string[]> = {}
  const sensitiveKeys = new Set(["password", "token", "secret", "authorization", "credential"])

  const addError = (rawField: string, rawMessage: unknown) => {
    let fieldName = rawField.replace(/^(body|query|path)\./, "").trim() || "root"
    let message = typeof rawMessage === "string" ? rawMessage : "Invalid value"

    if (sensitiveKeys.has(fieldName.toLowerCase())) {
      message = "Invalid value provided."
    }

    if (!fieldErrors[fieldName]) {
      fieldErrors[fieldName] = []
    }
    fieldErrors[fieldName].push(message)
  }

  if (Array.isArray(rawDetails)) {
    if (rawDetails.length === 0) return undefined
    for (const item of rawDetails) {
      if (typeof item !== "object" || item === null) continue

      let fieldName = "root"
      if ("field" in item && typeof item.field === "string") {
        fieldName = item.field
      } else if ("loc" in item && Array.isArray(item.loc)) {
        fieldName =
          item.loc
            .filter((seg: unknown) => seg !== "body" && seg !== "query" && seg !== "path")
            .join(".") || "root"
      }

      let message = "Invalid value"
      if ("message" in item && typeof item.message === "string") {
        message = item.message
      } else if ("msg" in item && typeof item.msg === "string") {
        message = item.msg
      }

      addError(fieldName, message)
    }
  } else {
    const dict = (
      "field_errors" in rawDetails && typeof (rawDetails as any).field_errors === "object"
        ? (rawDetails as any).field_errors
        : rawDetails
    ) as Record<string, unknown>

    for (const [key, val] of Object.entries(dict)) {
      if (key === "success" || key === "error" || key === "request_id") continue
      if (Array.isArray(val)) {
        for (const msg of val) {
          if (typeof msg === "string") addError(key, msg)
        }
      } else if (typeof val === "string") {
        addError(key, val)
      }
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined
}

export function normalizeApiError(error: unknown): AppApiError {
  if (error instanceof AppApiError) {
    return error
  }

  if (axios.isAxiosError(error)) {
    // 1. Canceled / Aborted request
    if (axios.isCancel(error) || error.name === "CanceledError") {
      return new AppApiError({
        code: "REQUEST_CANCELLED",
        message: "Request was cancelled.",
        status: 0,
      })
    }

    // 2. Network error / Timeout (no HTTP response received)
    if (!error.response) {
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        return new AppApiError({
          code: "TIMEOUT_ERROR",
          message: getHumanErrorMessage("TIMEOUT_ERROR"),
          status: 408,
        })
      }
      return new AppApiError({
        code: "NETWORK_ERROR",
        message: getHumanErrorMessage("NETWORK_ERROR"),
        status: 0,
      })
    }

    // 3. HTTP response received
    const status = error.response.status
    const headers = error.response.headers || {}
    const data = error.response.data as Partial<ApiErrorPayload> | undefined

    // Extract tracing Request ID from headers or body
    const requestId =
      headers["x-request-id"] ||
      headers["X-Request-ID"] ||
      data?.request_id

    // Extract Retry-After if present (e.g. 429 Rate Limit)
    let retryAfterSeconds: number | undefined
    const retryHeader = headers["retry-after"] || headers["Retry-After"]
    if (retryHeader) {
      const parsed = parseInt(String(retryHeader), 10)
      if (!isNaN(parsed) && parsed > 0) {
        retryAfterSeconds = parsed
      }
    }

    // Handle 400 and 422 Validation Errors with field mapping
    if (status === 422 || status === 400) {
      const fieldErrors = normalizeValidationDetails(data?.error?.details)
      if (fieldErrors || status === 422) {
        return new AppApiError({
          code: data?.error?.code || "VALIDATION_ERROR",
          message:
            data?.error?.message ||
            getHumanErrorMessage(data?.error?.code || "VALIDATION_ERROR"),
          status,
          requestId,
          fieldErrors,
          retryAfterSeconds,
          details: data?.error?.details,
        })
      }
    }

    // Handle canonical backend error payload
    if (data?.error) {
      const code = data.error.code || `HTTP_${status}`
      let userMessage = getHumanErrorMessage(code, data.error.message)

      // Guard internal 5xx errors from exposing stack or server details
      if (status >= 500) {
        userMessage = "Our servers are having trouble right now. Please try again shortly."
      } else if (status === 413) {
        userMessage = getHumanErrorMessage("UPLOAD_TOO_LARGE", userMessage)
      } else if (status === 403 && !data.error.message) {
        userMessage = getHumanErrorMessage("FORBIDDEN")
      }

      const fieldErrors = normalizeValidationDetails(data.error.details)

      return new AppApiError({
        code,
        message: userMessage,
        status,
        requestId,
        fieldErrors,
        retryAfterSeconds,
        details: data.error.details,
      })
    }

    // Safe fallback for generic HTTP status codes without envelope
    const fallbackMessage =
      status >= 500
        ? "Our servers are having trouble right now. Please try again shortly."
        : status === 413
        ? "This image exceeds the 12 MB upload limit. Please select a smaller file."
        : status === 403
        ? "You do not have permission to access this resource."
        : `Request failed with status ${status}`

    return new AppApiError({
      code: `HTTP_${status}`,
      message: fallbackMessage,
      status,
      requestId,
      retryAfterSeconds,
    })
  }

  if (error instanceof Error) {
    return new AppApiError({
      code: "CLIENT_ERROR",
      message: error.message,
      status: 0,
    })
  }

  return new AppApiError({
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred.",
    status: 0,
  })
}
