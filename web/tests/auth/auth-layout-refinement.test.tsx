import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { Routes, Route } from "react-router-dom"
import { AuthLayout } from "../../src/layouts/auth-layout"
import { LoginForm } from "../../src/features/auth/components/login-form"
import { RegisterForm } from "../../src/features/auth/components/register-form"
import { PageProgressController } from "../../src/features/landing/components/page-progress-controller"
import { LandingHeader } from "../../src/features/landing/components/landing-header"
import { createAllProvidersWrapper } from "../../src/test/render"
import * as authHook from "../../src/features/auth/use-auth"
import type { AuthContextType } from "../../src/features/auth/types"

describe("Auth + Header Refinements", () => {
  const defaultAuthContext: AuthContextType = {
    user: null,
    status: "unauthenticated",
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(authHook, "useAuth").mockReturnValue(defaultAuthContext)
  })

  describe("AuthLayout Structure", () => {
    it("renders back-to-home button with accessible link and hit target", () => {
      const wrapper = createAllProvidersWrapper(["/login"])
      render(
        <Routes>
          <Route path="/login" element={<AuthLayout />}>
            <Route index element={<div>Test Auth Content</div>} />
          </Route>
        </Routes>,
        { wrapper }
      )

      const backLink = screen.getByRole("link", { name: /back to home/i })
      expect(backLink).toBeInTheDocument()
      expect(backLink).toHaveAttribute("href", "/")
      expect(backLink.className).toContain("h-10") // 40px hit area
      expect(screen.getByText("Test Auth Content")).toBeInTheDocument()
    })

    it("renders fixed viewport background and document-flowing main content", () => {
      const wrapper = createAllProvidersWrapper(["/login"])
      const { container } = render(
        <Routes>
          <Route path="/login" element={<AuthLayout />}>
            <Route index element={<div>Form Placeholder</div>} />
          </Route>
        </Routes>,
        { wrapper }
      )

      const fixedBg = container.querySelector(".fixed.inset-0")
      expect(fixedBg).toBeInTheDocument()
      expect(fixedBg).toHaveAttribute("aria-hidden", "true")

      const main = container.querySelector("main")
      expect(main).toBeInTheDocument()
      expect(main?.className).toContain("auth-viewport-short")
    })
  })

  describe("LoginForm Card Constraints", () => {
    it("renders max-w-[440px] and auth-card-compact class", () => {
      const wrapper = createAllProvidersWrapper(["/login"])
      const { container } = render(<LoginForm />, { wrapper })

      const card = container.firstElementChild as HTMLElement
      expect(card.className).toContain("max-w-[440px]")
      expect(card.className).toContain("auth-card-compact")
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    })
  })

  describe("RegisterForm Card Constraints", () => {
    it("renders max-w-[460px] and auth-card-compact class with compact vertical rhythm", () => {
      const wrapper = createAllProvidersWrapper(["/register"])
      const { container } = render(<RegisterForm />, { wrapper })

      const card = container.firstElementChild as HTMLElement
      expect(card.className).toContain("max-w-[460px]")
      expect(card.className).toContain("auth-card-compact")
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })
  })

  describe("PageProgressController Refinements", () => {
    it("renders refined 1.25px track and 1.75px progress ring with 44px hit target", () => {
      const { container } = render(<PageProgressController />)

      const button = container.querySelector("button")
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute("aria-label", "Scroll to top")
      expect(button?.className).toContain("h-11")
      expect(button?.className).toContain("w-11")

      const circles = container.querySelectorAll("circle")
      expect(circles.length).toBe(2)
      expect(circles[0]).toHaveAttribute("stroke-width", "1.25")
      expect(circles[1]).toHaveAttribute("stroke-width", "1.75")
    })
  })

  describe("LandingHeader Sizing & Breakpoints", () => {
    it("renders desktop actions with standardized 40px height rhythm and mobile sheet trigger", () => {
      const wrapper = createAllProvidersWrapper(["/"])
      const { container } = render(<LandingHeader />, { wrapper })

      // Desktop actions container uses lg breakpoint
      const desktopActions = container.querySelector(".hidden.lg\\:flex")
      expect(desktopActions).toBeInTheDocument()

      // Primary CTA
      const startCta = screen.getByRole("link", { name: /start your try-on/i })
      expect(startCta.className).toContain("h-10") // 40px height
      expect(startCta.className).toContain("whitespace-nowrap")

      // Secondary Sign-in
      const signInBtn = screen.getByRole("link", { name: /sign in/i })
      expect(signInBtn.className).toContain("h-10") // 40px height
      expect(signInBtn.className).toContain("whitespace-nowrap")

      // Mobile trigger uses 44x44 target (h-11 w-11)
      const mobileTrigger = screen.getByRole("button", { name: /open mobile menu/i })
      expect(mobileTrigger).toBeInTheDocument()
      expect(mobileTrigger.className).toContain("h-11")
      expect(mobileTrigger.className).toContain("w-11")
    })
  })
})
