import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "../../src/features/auth"
import { RequireAuth } from "../../src/app/guards"
import { LoginForm } from "../../src/features/auth/components/login-form"
import { tokenStore } from "../../src/lib/auth/token-store"
import * as authApi from "../../src/features/auth/api"

vi.mock("../../src/features/auth/api", () => ({
  getCurrentUser: vi.fn(),
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  logoutUser: vi.fn(),
  refreshToken: vi.fn(),
}))

describe("Session Expiration & Recovery Flow", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    tokenStore.clearTokens()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  it("handles session expiry event by redirecting to login with calm banner and returnTo state", async () => {
    tokenStore.setTokens("valid-access", "valid-refresh")

    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "usr_1",
      name: "Jane Doe",
      email: "jane@example.com",
    })

    function ProtectedWorkspace() {
      return <div>Protected Studio Screen</div>
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={["/app/try-ons/job_target_999"]}>
            <Routes>
              <Route element={<RequireAuth />}>
                <Route path="/app/try-ons/job_target_999" element={<ProtectedWorkspace />} />
              </Route>
              <Route path="/login" element={<LoginForm />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    )

    // Wait for bootstrap to authenticate and render protected content
    await waitFor(() => {
      expect(screen.getByText("Protected Studio Screen")).toBeInTheDocument()
    })

    // Simulate auth expired event dispatched when token refresh fails
    await act(async () => {
      window.dispatchEvent(new CustomEvent("vtryon:auth-expired"))
    })

    // Should redirect to login and display calm session expired message
    await waitFor(() => {
      expect(screen.getByText(/your session ended\. sign in again to continue\./i)).toBeInTheDocument()
    })

    expect(screen.queryByText("Protected Studio Screen")).not.toBeInTheDocument()
  })

  it("restores preserved returnTo destination upon successful re-login", async () => {
    const user = userEvent.setup()

    vi.mocked(authApi.loginUser).mockResolvedValueOnce({
      user: { id: "usr_1", name: "Jane", email: "jane@example.com" },
      tokens: { access_token: "new-acc", refresh_token: "new-ref", token_type: "bearer", expires_in: 1800 },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter
            initialEntries={[
              {
                pathname: "/login",
                state: { returnTo: "/app/try-ons/job_target_999", reason: "session-expired" },
              },
            ]}
          >
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/app/try-ons/job_target_999" element={<div>Target Try-On Job Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    )

    expect(screen.getByText(/your session ended\. sign in again to continue\./i)).toBeInTheDocument()

    // Sign back in
    await user.type(screen.getByLabelText(/email address/i), "jane@example.com")
    await user.type(screen.getByLabelText(/^password$/i), "secretpassword123")
    await user.click(screen.getByRole("button", { name: /^sign in$/i }))

    // Verified redirected to preserved returnTo
    await waitFor(() => {
      expect(screen.getByText("Target Try-On Job Page")).toBeInTheDocument()
    })
  })
})
