import { describe, it, expect } from "vitest"
import { AxiosError, CanceledError } from "axios"
import { AppApiError, getHumanErrorMessage, normalizeApiError } from "../errors"

describe("AppApiError and Error Normalization", () => {
  it("creates an AppApiError with proper code, message, and requestId", () => {
    const error = new AppApiError({
      code: "INVALID_CREDENTIALS",
      message: "Email or password is incorrect.",
      status: 401,
      requestId: "req_12345",
      retryAfterSeconds: 30,
    })

    expect(error).toBeInstanceOf(Error)
    expect(error.code).toBe("INVALID_CREDENTIALS")
    expect(error.message).toBe("Email or password is incorrect.")
    expect(error.status).toBe(401)
    expect(error.requestId).toBe("req_12345")
    expect(error.retryAfterSeconds).toBe(30)
  })

  it("maps known error codes to human friendly messages", () => {
    expect(getHumanErrorMessage("INVALID_CREDENTIALS")).toBe("Email or password is incorrect.")
    expect(getHumanErrorMessage("UPLOAD_TOO_LARGE")).toBe("This image exceeds the 12 MB upload limit. Please select a smaller file.")
    expect(getHumanErrorMessage("IMAGE_TOO_LARGE")).toBe("This image exceeds the 12 MB upload limit. Please select a smaller file.")
    expect(getHumanErrorMessage("MODEL_UNAVAILABLE")).toBe("Try-on engine is temporarily busy. Please try again shortly.")
    expect(getHumanErrorMessage("CUSTOM_CODE", "Custom Fallback")).toBe("Custom Fallback")
  })

  it("normalizes Axios backend error response envelopes", () => {
    const axiosError = new AxiosError(
      "Request failed with status code 400",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: { headers: {} } as any,
        data: {
          success: false,
          error: {
            code: "UPLOAD_TOO_LARGE",
            message: "File exceeds 10MB limit",
          },
          request_id: "req_upload_fail",
        },
      }
    )

    const normalized = normalizeApiError(axiosError)
    expect(normalized).toBeInstanceOf(AppApiError)
    expect(normalized.code).toBe("UPLOAD_TOO_LARGE")
    expect(normalized.message).toBe("This image exceeds the 12 MB upload limit. Please select a smaller file.")
    expect(normalized.requestId).toBe("req_upload_fail")
    expect(normalized.status).toBe(400)
  })

  it("normalizes dictionary-based validation errors into fieldErrors", () => {
    const axiosError = new AxiosError(
      "Bad Request",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        status: 400,
        statusText: "Bad Request",
        headers: { "x-request-id": "req_val_dict" },
        config: { headers: {} } as any,
        data: {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: {
              email: ["Please provide a valid email."],
              name: ["Name is required."],
            },
          },
        },
      }
    )

    const normalized = normalizeApiError(axiosError)
    expect(normalized.status).toBe(400)
    expect(normalized.fieldErrors).toBeDefined()
    expect(normalized.fieldErrors?.email).toEqual(["Please provide a valid email."])
    expect(normalized.fieldErrors?.name).toEqual(["Name is required."])
  })

  it("maps 413 without envelope to 12 MB configured limit message", () => {
    const axiosError = new AxiosError(
      "Payload Too Large",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        status: 413,
        statusText: "Payload Too Large",
        headers: {},
        config: { headers: {} } as any,
        data: "Request Entity Too Large",
      }
    )

    const normalized = normalizeApiError(axiosError)
    expect(normalized.status).toBe(413)
    expect(normalized.message).toBe("This image exceeds the 12 MB upload limit. Please select a smaller file.")
  })

  it("normalizes 422 validation errors with field path mapping", () => {
    const axiosError = new AxiosError(
      "Unprocessable Entity",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        status: 422,
        statusText: "Unprocessable Entity",
        headers: { "x-request-id": "req_val_1" },
        config: { headers: {} } as any,
        data: {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: [
              { loc: ["body", "email"], msg: "Invalid email format" },
              { loc: ["body", "password"], msg: "Password too short: secret123" },
              { field: "category", message: "Unknown category" },
            ],
          },
        },
      }
    )

    const normalized = normalizeApiError(axiosError)
    expect(normalized.status).toBe(422)
    expect(normalized.code).toBe("VALIDATION_ERROR")
    expect(normalized.requestId).toBe("req_val_1")
    expect(normalized.fieldErrors).toBeDefined()
    expect(normalized.fieldErrors?.email).toEqual(["Invalid email format"])
    // Sensitive field value should be scrubbed
    expect(normalized.fieldErrors?.password).toEqual(["Invalid value provided."])
    expect(normalized.fieldErrors?.category).toEqual(["Unknown category"])
  })

  it("extracts retryAfterSeconds from 429 responses", () => {
    const axiosError = new AxiosError(
      "Too Many Requests",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        status: 429,
        statusText: "Too Many Requests",
        headers: {
          "retry-after": "15",
          "x-request-id": "req_rate_limit",
        },
        config: { headers: {} } as any,
        data: {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests",
          },
        },
      }
    )

    const normalized = normalizeApiError(axiosError)
    expect(normalized.status).toBe(429)
    expect(normalized.code).toBe("RATE_LIMIT_EXCEEDED")
    expect(normalized.retryAfterSeconds).toBe(15)
    expect(normalized.requestId).toBe("req_rate_limit")
  })

  it("sanitizes 500 server errors so internal details do not leak", () => {
    const axiosError = new AxiosError(
      "Internal Server Error",
      "ERR_INTERNAL",
      undefined,
      undefined,
      {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
        config: { headers: {} } as any,
        data: {
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed at /app/server.py:84",
          },
        },
      }
    )

    const normalized = normalizeApiError(axiosError)
    expect(normalized.status).toBe(500)
    expect(normalized.message).not.toContain("/app/server.py")
    expect(normalized.message).toBe("Our servers are having trouble right now. Please try again shortly.")
  })

  it("normalizes network failures without response to status 0 and NETWORK_ERROR", () => {
    const networkError = new AxiosError("Network Error", "ERR_NETWORK")
    const normalized = normalizeApiError(networkError)

    expect(normalized.code).toBe("NETWORK_ERROR")
    expect(normalized.status).toBe(0)
    expect(normalized.message).toBe("We couldn't reach V Try-On. Please check your internet connection.")
  })

  it("normalizes timeout errors to TIMEOUT_ERROR and status 408", () => {
    const timeoutError = new AxiosError("timeout of 10000ms exceeded", "ECONNABORTED")
    const normalized = normalizeApiError(timeoutError)

    expect(normalized.code).toBe("TIMEOUT_ERROR")
    expect(normalized.status).toBe(408)
    expect(normalized.message).toBe("The request took too long to complete. Please try again.")
  })

  it("normalizes aborted or cancelled requests to REQUEST_CANCELLED", () => {
    const cancelError = new CanceledError("canceled")
    const normalized = normalizeApiError(cancelError)

    expect(normalized.code).toBe("REQUEST_CANCELLED")
    expect(normalized.status).toBe(0)
    expect(normalized.message).toBe("Request was cancelled.")
  })

  it("normalizes unknown generic errors safely", () => {
    const plainError = new Error("Something strange")
    const normalized = normalizeApiError(plainError)

    expect(normalized.code).toBe("CLIENT_ERROR")
    expect(normalized.message).toBe("Something strange")

    const nonError = normalizeApiError({ random: 123 })
    expect(nonError.code).toBe("UNKNOWN_ERROR")
    expect(nonError.message).toBe("An unexpected error occurred.")
  })
})
