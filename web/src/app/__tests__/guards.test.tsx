import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { RequireAuth, RequireGuest } from "../guards"
import * as authModule from "@/features/auth/use-auth"
import type { AuthContextType } from "@/features/auth/types"

describe("Route Guards", () => {
  const mockAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
    user: null,
    status: "unauthenticated",
    authReason: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    clearAuthReason: vi.fn(),
    ...overrides,
  })

  describe("RequireAuth Guard", () => {
    it("renders AuthBootState when auth state is loading/unknown", () => {
      vi.spyOn(authModule, "useAuth").mockReturnValue(
        mockAuthContext({ isLoading: true, status: "unknown" })
      )

      render(
        <MemoryRouter initialEntries={["/app/studio"]}>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route path="/app/studio" element={<div>Protected Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByRole("status", { name: /checking authentication/i })).toBeInTheDocument()
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument()
    })

    it("redirects unauthenticated visitor to login preserving returnTo state", () => {
      vi.spyOn(authModule, "useAuth").mockReturnValue(
        mockAuthContext({ isAuthenticated: false, isLoading: false, status: "unauthenticated" })
      )

      render(
        <MemoryRouter initialEntries={["/app/history"]}>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route path="/app/history" element={<div>Protected History</div>} />
            </Route>
            <Route path="/login" element={<div>Login Page Target</div>} />
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByText("Login Page Target")).toBeInTheDocument()
      expect(screen.queryByText("Protected History")).not.toBeInTheDocument()
    })

    it("renders protected child content when authenticated", () => {
      vi.spyOn(authModule, "useAuth").mockReturnValue(
        mockAuthContext({
          isAuthenticated: true,
          isLoading: false,
          status: "authenticated",
          user: { id: "usr_123", email: "jane@example.com", name: "Jane" },
        })
      )

      render(
        <MemoryRouter initialEntries={["/app/studio"]}>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route path="/app/studio" element={<div>Protected Studio Workspace</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByText("Protected Studio Workspace")).toBeInTheDocument()
    })
  })

  describe("RequireGuest Guard", () => {
    it("renders AuthBootState when auth state is loading/unknown", () => {
      vi.spyOn(authModule, "useAuth").mockReturnValue(
        mockAuthContext({ isLoading: true, status: "unknown" })
      )

      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route element={<RequireGuest />}>
              <Route path="/login" element={<div>Login Form</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByRole("status", { name: /checking authentication/i })).toBeInTheDocument()
      expect(screen.queryByText("Login Form")).not.toBeInTheDocument()
    })

    it("renders guest auth route when unauthenticated", () => {
      vi.spyOn(authModule, "useAuth").mockReturnValue(
        mockAuthContext({ isAuthenticated: false, isLoading: false, status: "unauthenticated" })
      )

      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route element={<RequireGuest />}>
              <Route path="/login" element={<div>Login Form Active</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByText("Login Form Active")).toBeInTheDocument()
    })

    it("redirects authenticated user away from guest route to /app/studio default", () => {
      vi.spyOn(authModule, "useAuth").mockReturnValue(
        mockAuthContext({
          isAuthenticated: true,
          isLoading: false,
          status: "authenticated",
          user: { id: "usr_123", email: "jane@example.com", name: "Jane" },
        })
      )

      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route element={<RequireGuest />}>
              <Route path="/login" element={<div>Login Form</div>} />
            </Route>
            <Route path="/app/studio" element={<div>Studio Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByText("Studio Dashboard")).toBeInTheDocument()
      expect(screen.queryByText("Login Form")).not.toBeInTheDocument()
    })

    it("redirects authenticated user to safe returnTo destination when present in state", () => {
      vi.spyOn(authModule, "useAuth").mockReturnValue(
        mockAuthContext({
          isAuthenticated: true,
          isLoading: false,
          status: "authenticated",
          user: { id: "usr_123", email: "jane@example.com", name: "Jane" },
        })
      )

      render(
        <MemoryRouter initialEntries={[{ pathname: "/login", state: { returnTo: "/app/history" } }]}>
          <Routes>
            <Route element={<RequireGuest />}>
              <Route path="/login" element={<div>Login Form</div>} />
            </Route>
            <Route path="/app/history" element={<div>Preserved History</div>} />
            <Route path="/app/studio" element={<div>Studio Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByText("Preserved History")).toBeInTheDocument()
      expect(screen.queryByText("Studio Dashboard")).not.toBeInTheDocument()
    })
  })
})
