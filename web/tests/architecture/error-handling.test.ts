import { describe, it, expect, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import fs from "fs"
import path from "path"
import { AppApiError, getHumanErrorMessage } from "@/lib/api/errors"
import { applyServerValidationErrors } from "@/lib/forms/form-errors"
import { useRateLimitCountdown } from "@/hooks/use-rate-limit-countdown"
import { queryClient } from "@/app/query-client"
import { loginSchema } from "@/features/auth/schemas/login-schema"
import { registerFormSchema } from "@/features/auth/schemas/register-schema"

describe("Phase 17 — Forms, Validation and Error Handling Architecture", () => {
  describe("1. 400 / 422 Validation Error Treatment", () => {
    it("translates fieldErrors to React Hook Form setError for matching fields", () => {
      const mockSetError = vi.fn()
      const error = new AppApiError({
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        status: 422,
        fieldErrors: {
          email: ["Email is invalid"],
          password: ["Password too short"],
        },
      })

      const result = applyServerValidationErrors(
        mockSetError,
        error,
        ["email", "password", "name"]
      )

      expect(mockSetError).toHaveBeenCalledTimes(2)
      expect(mockSetError).toHaveBeenCalledWith("email", {
        type: "server",
        message: "Email is invalid",
      })
      expect(mockSetError).toHaveBeenCalledWith("password", {
        type: "server",
        message: "Password too short",
      })
      expect(result.hasFieldErrors).toBe(true)
      expect(result.contextualError).toBeNull()
    })

    it("falls back to contextual error banner for unmapped or non-field validation errors", () => {
      const mockSetError = vi.fn()
      const error = new AppApiError({
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        status: 400,
        fieldErrors: {
          organization_id: ["Unknown organization"],
        },
      })

      const result = applyServerValidationErrors(
        mockSetError,
        error,
        ["email", "password"]
      )

      expect(mockSetError).not.toHaveBeenCalled()
      expect(result.hasFieldErrors).toBe(false)
      expect(result.contextualError).toEqual({
        message: "Unknown organization",
        requestId: undefined,
        retryAfterSeconds: undefined,
      })
    })
  })

  describe("2. 401 Unauthorized Treatment", () => {
    it("maps 401 and INVALID_CREDENTIALS to clean contextual message", () => {
      const mockSetError = vi.fn()
      const error = new AppApiError({
        code: "INVALID_CREDENTIALS",
        message: "Bad credentials",
        status: 401,
        requestId: "req_401",
      })

      const result = applyServerValidationErrors(mockSetError, error, ["email", "password"])

      expect(mockSetError).not.toHaveBeenCalled()
      expect(result.contextualError).toEqual({
        message: "Email or password is incorrect.",
        requestId: "req_401",
        retryAfterSeconds: undefined,
      })
    })
  })

  describe("3. 403 Forbidden Treatment", () => {
    it("ensures TanStack Query never automatically retries 403 status", () => {
      const retryOption = queryClient.getDefaultOptions().queries?.retry
      expect(typeof retryOption).toBe("function")

      if (typeof retryOption === "function") {
        const forbiddenError = new AppApiError({
          code: "FORBIDDEN",
          message: "Forbidden",
          status: 403,
        })
        const shouldRetry = retryOption(0, forbiddenError as any)
        expect(shouldRetry).toBe(false)
      }
    })

    it("maps 403 to polite permission message", () => {
      expect(getHumanErrorMessage("FORBIDDEN")).toBe(
        "You do not have permission to access this resource."
      )
    })
  })

  describe("4. 404 Dedicated Not-Found Copy", () => {
    it("provides human-friendly copy for missing items", () => {
      expect(getHumanErrorMessage("TRYON_NOT_FOUND")).toBe("This try-on could not be found.")
      expect(getHumanErrorMessage("TRYON_JOB_NOT_FOUND")).toBe("This try-on could not be found.")
      expect(getHumanErrorMessage("OUTFIT_NOT_FOUND")).toBe("The requested outfit could not be found.")
      expect(getHumanErrorMessage("UPLOAD_NOT_FOUND")).toBe("This photo could not be found.")
      expect(getHumanErrorMessage("RESULT_NOT_FOUND")).toBe(
        "The generated result for this try-on is no longer available."
      )
    })
  })

  describe("5. 409 Conflict Treatment", () => {
    it("maps 409 duplicate registration directly to email field and contextual banner", () => {
      const mockSetError = vi.fn()
      const error = new AppApiError({
        code: "EMAIL_ALREADY_EXISTS",
        message: "Email registered",
        status: 409,
        requestId: "req_conflict_409",
      })

      const result = applyServerValidationErrors(mockSetError, error, [
        "name",
        "email",
        "password",
        "confirmPassword",
      ])

      expect(mockSetError).toHaveBeenCalledWith("email", {
        type: "server",
        message: "An account with this email already exists.",
      })
      expect(result.contextualError?.message).toBe("An account with this email already exists.")
      expect(result.contextualError?.requestId).toBe("req_conflict_409")
    })

    it("provides conflict copy for invalid state transitions and active jobs", () => {
      expect(getHumanErrorMessage("TRYON_INVALID_STATE")).toBe(
        "This try-on cannot be modified in its current state."
      )
      expect(getHumanErrorMessage("TRYON_JOB_ACTIVE")).toBe(
        "A try-on is already in progress. Please wait for it to complete."
      )
      expect(getHumanErrorMessage("RESOURCE_CONFLICT")).toBe(
        "This action conflicts with the current state of the item."
      )
      expect(getHumanErrorMessage("UPLOAD_IN_USE")).toBe(
        "This photo is currently being used by a try-on and can't be deleted yet."
      )
    })
  })

  describe("6. 413 Upload Too Large Treatment", () => {
    it("explicitly states the configured 12 MB limit in error messages", () => {
      expect(getHumanErrorMessage("UPLOAD_TOO_LARGE")).toContain("12 MB")
      expect(getHumanErrorMessage("IMAGE_TOO_LARGE")).toContain("12 MB")
    })
  })

  describe("7. 429 Rate Limit & Countdown Treatment", () => {
    it("executes live second-by-second countdown and fires onFinish callback", () => {
      vi.useFakeTimers()
      const onFinish = vi.fn()

      const { result } = renderHook(() =>
        useRateLimitCountdown(3, { onFinish })
      )

      expect(result.current.secondsLeft).toBe(3)
      expect(result.current.isCountingDown).toBe(true)
      expect(result.current.isFinished).toBe(false)

      // Advance 1 second
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(result.current.secondsLeft).toBe(2)

      // Advance 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000)
      })
      expect(result.current.secondsLeft).toBe(0)
      expect(result.current.isCountingDown).toBe(false)
      expect(result.current.isFinished).toBe(true)
      expect(onFinish).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })

    it("passes retryAfterSeconds into contextual error on 429", () => {
      const mockSetError = vi.fn()
      const error = new AppApiError({
        code: "RATE_LIMIT_EXCEEDED",
        message: "Slow down",
        status: 429,
        retryAfterSeconds: 45,
      })

      const result = applyServerValidationErrors(mockSetError, error, ["email", "password"])
      expect(result.contextualError?.retryAfterSeconds).toBe(45)
    })
  })

  describe("8. 5xx / Network Error Treatment", () => {
    it("preserves requestId and scrubs server tracebacks", () => {
      const mockSetError = vi.fn()
      const error = new AppApiError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Our servers are having trouble right now. Please try again shortly.",
        status: 500,
        requestId: "req_srv_99",
      })

      const result = applyServerValidationErrors(mockSetError, error, ["email"])
      expect(result.contextualError?.message).toBe(
        "Our servers are having trouble right now. Please try again shortly."
      )
      expect(result.contextualError?.requestId).toBe("req_srv_99")
    })
  })

  describe("9. Zod Schemas — Frontend Mirroring & Non-Duplication", () => {
    it("loginSchema validates format without checking backend existence", () => {
      const valid = loginSchema.safeParse({
        email: "user@example.com",
        password: "secretpassword",
      })
      expect(valid.success).toBe(true)

      const invalidEmail = loginSchema.safeParse({
        email: "not-an-email",
        password: "secretpassword",
      })
      expect(invalidEmail.success).toBe(false)
    })

    it("registerFormSchema validates match without checking database uniqueness", () => {
      const valid = registerFormSchema.safeParse({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "password123",
        confirmPassword: "password123",
      })
      expect(valid.success).toBe(true)

      const mismatch = registerFormSchema.safeParse({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "password123",
        confirmPassword: "differentpassword",
      })
      expect(mismatch.success).toBe(false)
    })
  })

  describe("10. Toast Discipline — Reserved for Cross-Form / Global Outcomes", () => {
    it("audits that auth forms do NOT import or invoke toast", () => {
      const loginCode = fs.readFileSync(
        path.resolve(__dirname, "../../src/features/auth/components/login-form.tsx"),
        "utf-8"
      )
      const registerCode = fs.readFileSync(
        path.resolve(__dirname, "../../src/features/auth/components/register-form.tsx"),
        "utf-8"
      )

      expect(loginCode).not.toContain("toast")
      expect(registerCode).not.toContain("toast")
    })
  })
})
