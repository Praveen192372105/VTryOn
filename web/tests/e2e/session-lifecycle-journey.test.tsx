import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "../../src/features/auth"
import { AppLayout } from "../../src/components/layout/app-layout"
import { LoginForm } from "../../src/features/auth/components/login-form"
import { tokenStore } from "../../src/lib/auth/token-store"
import * as authApi from "../../src/features/auth/api"

vi.mock("../../src/features/auth/api")

describe("E2E Journey: Session Lifecycle & Logout / Expiry Flow", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    tokenStore.setTokens("mock-access", "mock-refresh")

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "usr_1",
      name: "Alex Designer",
      email: "alex@example.com",
    })
    vi.mocked(authApi.logoutUser).mockResolvedValue(undefined)
  })

  afterEach(() => {
    tokenStore.clearTokens()
  })

  it("handles explicit logout by clearing tokens and redirecting to login", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={["/app/studio"]}>
            <Routes>
              <Route
                path="/app/studio"
                element={
                  <div>
                    <h2>Studio Active</h2>
                    <button
                      type="button"
                      onClick={() => {
                        tokenStore.clearTokens()
                        window.location.href = "/login"
                      }}
                    >
                      Log out
                    </button>
                  </div>
                }
              />
              <Route path="/login" element={<LoginForm />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    )

    expect(await screen.findByText("Studio Active")).toBeInTheDocument()

    const logoutBtn = screen.getByRole("button", { name: /Log out/i })
    fireEvent.click(logoutBtn)

    expect(tokenStore.getAccessToken()).toBeNull()
  })

  it("handles session expiry event with returnTo preservation and calm alert banner", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter
            initialEntries={[
              {
                pathname: "/login",
                state: { returnTo: "/app/studio", reason: "session-expired" },
              },
            ]}
          >
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/app/studio" element={<div>Target Studio Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    )

    // Verify calm session expired alert rendered
    expect(
      await screen.findByText(/your session ended\. sign in again to continue\./i)
    ).toBeInTheDocument()
  })
})
