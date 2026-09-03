import { describe, it, expect } from "vitest"
import { loginSchema, registerSchema } from "../schemas"

describe("Auth Zod Schemas", () => {
  describe("loginSchema", () => {
    it("validates correct email and password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "secretpassword123",
      })
      expect(result.success).toBe(true)
    })

    it("rejects invalid email addresses", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "secretpassword123",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.format().email?._errors[0]).toBe("Please enter a valid email address")
      }
    })

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("registerSchema", () => {
    it("validates valid registration details", () => {
      const result = registerSchema.safeParse({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "securepassword123",
      })
      expect(result.success).toBe(true)
    })

    it("rejects passwords shorter than 8 characters", () => {
      const result = registerSchema.safeParse({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "short",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.format().password?._errors[0]).toBe("Password must be at least 8 characters")
      }
    })

    it("rejects names shorter than 2 characters", () => {
      const result = registerSchema.safeParse({
        name: "J",
        email: "jane@example.com",
        password: "securepassword123",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.format().name?._errors[0]).toBe("Name must be at least 2 characters")
      }
    })
  })
})
