import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import LandingPage from "../../src/pages/public/landing-page"
import { createAllProvidersWrapper } from "../../src/test/render"
import * as authHook from "../../src/features/auth/use-auth"
import type { AuthContextType } from "../../src/features/auth/types"

const authState = (authenticated: boolean): AuthContextType => ({
  user: authenticated ? { id: "u1", email: "user@example.com", name: "Jane" } : null,
  status: authenticated ? "authenticated" : "unauthenticated",
  isAuthenticated: authenticated,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
})

describe("Editorial landing page", () => {
  beforeEach(() => vi.clearAllMocks())

  it("uses one clear heading, the existing brand logo, and the new editorial images", () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue(authState(false))
    const { container } = render(<LandingPage />, { wrapper: createAllProvidersWrapper(["/"]) })
    expect(container.querySelectorAll("h1")).toHaveLength(1)
    expect(screen.getByRole("heading", { level: 1, name: /see the outfit.*on you/i })).toBeInTheDocument()
    expect(container.querySelector(".marketing-logo svg")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: /model wearing an espresso blazer/i })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: /curated neutral garments/i })).toBeInTheDocument()
  })

  it("provides working section targets and a mobile menu", () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue(authState(false))
    const { container } = render(<LandingPage />, { wrapper: createAllProvidersWrapper(["/"]) })
    for (const id of ["how-it-works", "experience", "privacy", "trust"]) {
      expect(container.querySelector(`#${id}`)).toBeInTheDocument()
      expect(container.querySelector(`a[href="#${id}"]`)).toBeInTheDocument()
    }
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true")
  })

  it("sends guests to signup and signed-in visitors to the studio", () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue(authState(false))
    const wrapper = createAllProvidersWrapper(["/"])
    const { rerender } = render(<LandingPage />, { wrapper })
    expect(screen.getAllByRole("link", { name: /start your try-on/i })[0]).toHaveAttribute("href", "/register")
    vi.spyOn(authHook, "useAuth").mockReturnValue(authState(true))
    rerender(<LandingPage />)
    expect(screen.getAllByRole("link", { name: /open.*studio/i })[0]).toHaveAttribute("href", "/app/studio")
  })

  it("does not render the old animated diagram system", () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue(authState(false))
    const { container } = render(<LandingPage />, { wrapper: createAllProvidersWrapper(["/"]) })
    expect(container.querySelectorAll("svg motion, svg animate, .grid-flow-line")).toHaveLength(0)
    expect(container.querySelectorAll(".marketing-step-card")).toHaveLength(3)
  })
})
