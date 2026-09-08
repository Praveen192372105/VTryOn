import { AppApiError, normalizeApiError } from "../../../lib/api/errors"

export function mapAuthError(
  err: unknown,
  fallbackMessage = "We couldn't complete your request right now. Please try again."
): { message: string; requestId?: string } {
  // Support both AppApiError instances and duck-typed error objects
  const errorObj =
    err instanceof AppApiError
      ? err
      : typeof err === "object" && err !== null && ("code" in err || "status" in err)
      ? (err as { code?: string; status?: number; requestId?: string; message?: string })
      : normalizeApiError(err)

  if (errorObj.status === 401 || errorObj.code === "INVALID_CREDENTIALS") {
    return { message: "Email or password is incorrect.", requestId: errorObj.requestId }
  }

  if (
    errorObj.status === 409 ||
    errorObj.code === "EMAIL_ALREADY_REGISTERED" ||
    errorObj.code === "EMAIL_ALREADY_EXISTS"
  ) {
    return { message: "An account with this email already exists.", requestId: errorObj.requestId }
  }

  if (errorObj.status === 429 || errorObj.code === "RATE_LIMIT_EXCEEDED") {
    return {
      message: "Too many attempts. Please wait a little and try again.",
      requestId: errorObj.requestId,
    }
  }

  if (errorObj.status === 503) {
    return {
      message: "Authentication is temporarily unavailable. Please try again shortly.",
      requestId: errorObj.requestId,
    }
  }

  if (errorObj.code === "NETWORK_ERROR") {
    return {
      message: "We couldn't reach the server. Check your connection and try again.",
      requestId: errorObj.requestId,
    }
  }

  if (errorObj.message && errorObj.message !== "An unexpected error occurred. Please try again.") {
    return {
      message: errorObj.message,
      requestId: errorObj.requestId,
    }
  }

  return { message: fallbackMessage }
}
