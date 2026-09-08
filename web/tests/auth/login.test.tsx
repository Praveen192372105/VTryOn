import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import fs from "fs"
import path from "path"
import LoginPage from "../../src/pages/auth/login-page"
import { AuthLayout } from "../../src/components/layout/auth-layout"
import { createAllProvidersWrapper } from "../../src/test/render"
import * as authHook from "../../src/features/auth/use-auth"
import type { AuthContextType } from "../../src/features/auth/types"
import { AppApiError } from "../../src/lib/api/errors"

const AUTH_FEATURE_DIR = path.resolve(__dirname, "../../src/features/auth")

function getFilesRecursively(dir: string): string[] {
  let results: string[] = []
  const list = fs.readdirSync(dir)

  for (const file of list) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath))
    } else if (/\.(ts|tsx)$/.test(file)) {
      results.push(filePath)
    }
  }

  return results
}

describe("Login Flow — Phase 4 Tests", () => {
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

  it("renders centered login form with correct hierarchy and fields", () => {
    const wrapper = createAllProvidersWrapper(["/login"])
    render(<LoginPage />, { wrapper })

    expect(screen.getByRole("heading", { level: 1, name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /create an account/i })).toHaveAttribute("href", "/register")
  })

  it("validates empty inputs and prevents submission", async () => {
    const user = userEvent.setup()
    const wrapper = createAllProvidersWrapper(["/login"])
    render(<LoginPage />, { wrapper })

    const submitBtn = screen.getByRole("button", { name: /^sign in$/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })

    expect(mockLogin).not.toHaveBeenCalled()
  })

  it("validates invalid email syntax", async () => {
    const user = userEvent.setup()
    const wrapper = createAllProvidersWrapper(["/login"])
    render(<LoginPage />, { wrapper })

    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, "not-an-email")
    await user.click(screen.getByRole("button", { name: /^sign in$/i }))

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })

    expect(mockLogin).not.toHaveBeenCalled()
  })

  it("toggles password visibility without submitting form or losing value", async () => {
    const user = userEvent.setup()
    const wrapper = createAllProvidersWrapper(["/login"])
    render(<LoginPage />, { wrapper })

    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement
    await user.type(passwordInput, "Secret123!")

    expect(passwordInput.type).toBe("password")

    const toggleBtn = screen.getByRole("button", { name: /show password/i })
    expect(toggleBtn).toHaveAttribute("type", "button")

    await user.click(toggleBtn)

    expect(passwordInput.type).toBe("text")
    expect(passwordInput.value).toBe("Secret123!")
    expect(screen.getByRole("button", { name: /hide password/i })).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: /hide password/i }))
    expect(passwordInput.type).toBe("password")
    expect(passwordInput.value).toBe("Secret123!")
  })

  it("submits valid credentials and calls auth login", async () => {
    mockLogin.mockResolvedValueOnce({
      tokens: { access_token: "access_token", refresh_token: "refresh_token" },
      user: { id: "u1", email: "user@example.com", name: "User One" },
    })

    const user = userEvent.setup()
    const wrapper = createAllProvidersWrapper(["/login"])
    render(<LoginPage />, { wrapper })

    await user.type(screen.getByLabelText(/email address/i), "user@example.com")
    await user.type(screen.getByLabelText(/^password$/i), "validpassword123")
    await user.click(screen.getByRole("button", { name: /^sign in$/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "validpassword123",
      })
    })
  })

  it("maps 401 invalid credentials to accessible alert", async () => {
    mockLogin.mockRejectedValueOnce(
      new AppApiError({
        message: "Invalid login credentials",
        status: 401,
        code: "INVALID_CREDENTIALS",
        requestId: "req_test_401",
      })
    )

    const user = userEvent.setup()
    const wrapper = createAllProvidersWrapper(["/login"])
    render(<LoginPage />, { wrapper })

    await user.type(screen.getByLabelText(/email address/i), "user@example.com")
    await user.type(screen.getByLabelText(/^password$/i), "wrongpassword")
    await user.click(screen.getByRole("button", { name: /^sign in$/i }))

    await waitFor(() => {
      const alert = screen.getByRole("alert")
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent(/email or password is incorrect/i)
      expect(alert).toHaveTextContent(/req_test_401/i)
    })
  })

  it("renders auth background patterns as aria-hidden and non-interactive", () => {
    const wrapper = createAllProvidersWrapper(["/login"])
    const { container } = render(
      <AuthLayout />,
      { wrapper }
    )

    const decorativePatterns = container.querySelectorAll("[aria-hidden='true'].pointer-events-none")
    expect(decorativePatterns.length).toBeGreaterThanOrEqual(2)
  })

  it("strictly audits zero raster images in auth feature files", () => {
    const authFiles = getFilesRecursively(AUTH_FEATURE_DIR)
    authFiles.push(path.resolve(__dirname, "../../src/pages/auth/login-page.tsx"))
    authFiles.push(path.resolve(__dirname, "../../src/pages/auth/register-page.tsx"))
    authFiles.push(path.resolve(__dirname, "../../src/components/layout/auth-layout.tsx"))

    const violations: { file: string; match: string }[] = []
    const rasterPattern = /\.(jpg|jpeg|png|webp)|background-image:\s*url/i

    for (const file of authFiles) {
      const content = fs.readFileSync(file, "utf-8")
      const match = content.match(rasterPattern)
      if (match) {
        violations.push({ file: path.basename(file), match: match[0] })
      }
    }

    expect(violations).toEqual([])
  })

  it("strictly audits that no unauthorized icon libraries are imported in auth", () => {
    const authFiles = getFilesRecursively(AUTH_FEATURE_DIR)
    authFiles.push(path.resolve(__dirname, "../../src/pages/auth/login-page.tsx"))
    authFiles.push(path.resolve(__dirname, "../../src/pages/auth/register-page.tsx"))
    authFiles.push(path.resolve(__dirname, "../../src/components/layout/auth-layout.tsx"))

    const bannedLibs = ["lucide-react", "react-icons", "@mui/icons-material", "@heroicons/react"]
    const violations: { file: string; library: string }[] = []

    for (const file of authFiles) {
      const content = fs.readFileSync(file, "utf-8")
      for (const lib of bannedLibs) {
        if (content.includes(`"${lib}"`) || content.includes(`'${lib}'`)) {
          violations.push({ file: path.basename(file), library: lib })
        }
      }
    }

    expect(violations).toEqual([])
  })
})
