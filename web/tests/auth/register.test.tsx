import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import RegisterPage from "../../src/pages/auth/register-page"
import { createAllProvidersWrapper } from "../../src/test/render"
import * as authHook from "../../src/features/auth/use-auth"
import type { AuthContextType } from "../../src/features/auth/types"
import { AppApiError } from "../../src/lib/api/errors"

describe("Registration Flow — Phase 4 Tests", () => {
  const mockLogin = vi.fn()
  const mockRegister = vi.fn()
  const mockLogout = vi.fn()

  const defaultAuthContext: AuthContextType = {
    user: null,
    status: "unauthenticated",
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(authHook, "useAuth").mockReturnValue(defaultAuthContext)
  })

  it("renders centered registration form with required fields and requirement helper", () => {
    const wrapper = createAllProvidersWrapper(["/register"])
    render(<RegisterPage />, { wrapper })

    expect(screen.getByRole("heading", { level: 1, name: /create your fitting room/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByText(/use at least 8 characters/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^create account$/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/login")
  })

  it("validates empty name and invalid email", async () => {
    const user = userEvent.setup()
    const wrapper = createAllProvidersWrapper(["/register"])
    render(<RegisterPage />, { wrapper })

    await user.type(screen.getByLabelText(/email address/i), "not-an-email")
    await user.click(screen.getByRole("button", { name: /^create account$/i }))

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })

    expect(mockRegister).not.toHaveBeenCalled()
  })

  it("validates password length under 8 characters", async () => {
    const user = userEvent.setup()
    const wrapper = createAllProvidersWrapper(["/register"])
    render(<RegisterPage />, { wrapper })

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe")
    await user.type(screen.getByLabelText(/email address/i), "jane@example.com")
    await user.type(screen.getByLabelText(/^password/i), "short")
    await user.type(screen.getByLabelText(/confirm password/i), "short")
    await user.click(screen.getByRole("button", { name: /^create account$/i }))

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    })

    expect(mockRegister).not.toHaveBeenCalled()
  })

  it("validates password mismatch between password and confirm password", async () => {
    const user = userEvent.setup()
    const wrapper = createAllProvidersWrapper(["/register"])
    render(<RegisterPage />, { wrapper })

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe")
    await user.type(screen.getByLabelText(/email address/i), "jane@example.com")
    await user.type(screen.getByLabelText(/^password/i), "securepass123")
    await user.type(screen.getByLabelText(/confirm password/i), "differentpass456")
    await user.click(screen.getByRole("button", { name: /^create account$/i }))

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })

    expect(mockRegister).not.toHaveBeenCalled()
  })

  it("submits valid registration and omits confirmPassword from payload", async () => {
    mockRegister.mockResolvedValueOnce({
      tokens: { access_token: "access_token_123", refresh_token: "refresh_token_123" },
      user: { id: "u2", email: "jane@example.com", name: "Jane Doe" },
    })

    const user = userEvent.setup()
    const wrapper = createAllProvidersWrapper(["/register"])
    render(<RegisterPage />, { wrapper })

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe")
    await user.type(screen.getByLabelText(/email address/i), "jane@example.com")
    await user.type(screen.getByLabelText(/^password/i), "securepass123")
    await user.type(screen.getByLabelText(/confirm password/i), "securepass123")
    await user.click(screen.getByRole("button", { name: /^create account$/i }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "securepass123",
      })
    })
  })

  it("maps 409 conflict error to user-friendly alert", async () => {
    mockRegister.mockRejectedValueOnce(
      new AppApiError({
        message: "Email already registered",
        status: 409,
        code: "EMAIL_ALREADY_EXISTS",
        requestId: "req_test_409",
      })
    )

    const user = userEvent.setup()
    const wrapper = createAllProvidersWrapper(["/register"])
    render(<RegisterPage />, { wrapper })

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe")
    await user.type(screen.getByLabelText(/email address/i), "existing@example.com")
    await user.type(screen.getByLabelText(/^password/i), "securepass123")
    await user.type(screen.getByLabelText(/confirm password/i), "securepass123")
    await user.click(screen.getByRole("button", { name: /^create account$/i }))

    await waitFor(() => {
      const alert = screen.getByRole("alert")
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent(/an account with this email already exists/i)
      expect(alert).toHaveTextContent(/req_test_409/i)
    })
  })
})
