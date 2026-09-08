import type { FieldValues, Path, UseFormSetError } from "react-hook-form"
import { normalizeApiError } from "@/lib/api/errors"

export interface ContextualFormError {
  message: string
  requestId?: string
  retryAfterSeconds?: number
}

export interface FormErrorMappingResult {
  hasFieldErrors: boolean
  contextualError: ContextualFormError | null
}

/**
 * Translates server validation errors (400/422/409) into React Hook Form field errors
 * when matching fields exist, falling back to a contextual banner for non-field or general errors.
 * Ensures the backend remains authoritative while presenting immediate field-level guidance.
 */
export function applyServerValidationErrors<TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
  err: unknown,
  knownFields: (keyof TFieldValues)[],
  fallbackMessage = "Please check your inputs and try again."
): FormErrorMappingResult {
  const error = normalizeApiError(err)
  let hasFieldErrors = false
  const unmappedMessages: string[] = []

  // 1. Map structured field errors (e.g. from 400 or 422)
  if (error.fieldErrors) {
    for (const [rawField, messages] of Object.entries(error.fieldErrors)) {
      const field = rawField as keyof TFieldValues
      const firstMessage = messages[0] || "Invalid value"

      if (knownFields.includes(field)) {
        setError(field as Path<TFieldValues>, {
          type: "server",
          message: firstMessage,
        })
        hasFieldErrors = true
      } else {
        unmappedMessages.push(firstMessage)
      }
    }
  }

  // 2. Map 409 Conflict duplicate email to email field if present
  const isDuplicateEmail =
    error.status === 409 ||
    error.code === "EMAIL_ALREADY_EXISTS" ||
    error.code === "EMAIL_ALREADY_REGISTERED"

  if (isDuplicateEmail && knownFields.includes("email" as keyof TFieldValues)) {
    setError("email" as Path<TFieldValues>, {
      type: "server",
      message: "An account with this email already exists.",
    })
    hasFieldErrors = true
  }

  // 3. Construct contextual error banner if needed
  let contextualMessage: string | null = null

  if (error.status === 401 || error.code === "INVALID_CREDENTIALS") {
    contextualMessage = "Email or password is incorrect."
  } else if (error.status === 429 || error.code === "RATE_LIMIT_EXCEEDED") {
    contextualMessage = "Too many attempts. Please wait a little and try again."
  } else if (isDuplicateEmail) {
    contextualMessage = "An account with this email already exists."
  } else if (error.status === 403 || error.code === "FORBIDDEN") {
    contextualMessage = "You do not have permission to access this resource."
  } else if (error.code === "NETWORK_ERROR") {
    contextualMessage = "We couldn't reach the server. Check your connection and try again."
  } else if (error.status >= 500) {
    contextualMessage = "Our servers are having trouble right now. Please try again shortly."
  } else if (unmappedMessages.length > 0) {
    contextualMessage = unmappedMessages.join(". ")
  } else if (!hasFieldErrors) {
    contextualMessage =
      error.message && error.message !== "An unexpected error occurred."
        ? error.message
        : fallbackMessage
  }

  const contextualError: ContextualFormError | null = contextualMessage
    ? {
        message: contextualMessage,
        requestId: error.requestId,
        retryAfterSeconds: error.retryAfterSeconds,
      }
    : null

  return {
    hasFieldErrors,
    contextualError,
  }
}
