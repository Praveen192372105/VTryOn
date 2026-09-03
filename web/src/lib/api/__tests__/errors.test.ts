import { describe, it, expect } from "vitest"
import { AxiosError } from "axios"
import { AppApiError, getHumanErrorMessage, normalizeApiError } from "../errors"

describe("AppApiError and Error Normalization", () => {
  it("creates an AppApiError with proper code, message, and requestId", () => {
    const error = new AppApiError({
      code: "INVALID_CREDENTIALS",
      message: "Email or password is incorrect.",
      status: 401,
      requestId: "req_12345",
    })

    expect(error).toBeInstanceOf(Error)
    expect(error.code).toBe("INVALID_CREDENTIALS")
    expect(error.message).toBe("Email or password is incorrect.")
    expect(error.status).toBe(401)
    expect(error.requestId).toBe("req_12345")
  })

  it("maps known error codes to human friendly messages", () => {
    expect(getHumanErrorMessage("INVALID_CREDENTIALS")).toBe("Email or password is incorrect.")
    expect(getHumanErrorMessage("UPLOAD_TOO_LARGE")).toBe("This image is larger than the allowed upload size.")
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
    expect(normalized.message).toBe("This image is larger than the allowed upload size.")
    expect(normalized.requestId).toBe("req_upload_fail")
    expect(normalized.status).toBe(400)
  })

  it("normalizes network failures without response", () => {
    const networkError = new AxiosError("Network Error", "ERR_NETWORK")
    const normalized = normalizeApiError(networkError)

    expect(normalized.code).toBe("NETWORK_ERROR")
    expect(normalized.message).toBe("Unable to connect to the server. Please check your internet connection.")
  })
})
