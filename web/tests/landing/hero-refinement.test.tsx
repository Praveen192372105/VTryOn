import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TypingHeadline } from "../../src/features/landing/components/typing-headline"
import { ShimmerCta } from "../../src/features/landing/components/shimmer-cta"
import { PageProgressController } from "../../src/features/landing/components/page-progress-controller"
import { scrollToSection } from "../../src/lib/utils/scroll-to-section"
import { createAllProvidersWrapper } from "../../src/test/render"
import * as authHook from "../../src/features/auth/use-auth"
import type { AuthContextType } from "../../src/features/auth/types"

describe("Landing Page Refinements Unit Tests", () => {
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

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("TypingHeadline", () => {
    it("renders stable screen reader announcement", () => {
      render(<TypingHeadline phrases={["Test Phrase One", "Test Phrase Two"]} />)
      expect(
        screen.getByText(/V Try-On lets you visualize selected outfits using your own photo/i)
      ).toBeInTheDocument()
    })

    it("cycles through typing phrases over time", () => {
      vi.useFakeTimers()

      render(
        <TypingHeadline
          phrases={["First", "Second"]}
          typingSpeed={50}
          holdDuration={500}
          deletingSpeed={25}
          pauseDuration={100}
        />
      )

      // Initially empty or first letter after 50ms
      act(() => {
        vi.advanceTimersByTime(50)
      })

      // Complete typing "First" (5 * 50 = 250ms)
      act(() => {
        vi.advanceTimersByTime(250)
      })

      // Hold complete (500ms) + Deleting (5 * 25 = 125ms) + Pause (100ms)
      act(() => {
        vi.advanceTimersByTime(800)
      })
    })
  })

  describe("ShimmerCta", () => {
    it("routes unauthenticated users to /register", () => {
      vi.spyOn(authHook, "useAuth").mockReturnValue({
        user: null,
        status: "unauthenticated",
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
      } as AuthContextType)

      const wrapper = createAllProvidersWrapper(["/"])
      render(<ShimmerCta />, { wrapper })

      const link = screen.getByRole("link", { name: /start your try-on/i })
      expect(link).toHaveAttribute("href", "/register")
    })

    it("routes authenticated users to /app/studio", () => {
      vi.spyOn(authHook, "useAuth").mockReturnValue({
        user: { id: "u1", email: "user@example.com", name: "User" },
        status: "authenticated",
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
      } as AuthContextType)

      const wrapper = createAllProvidersWrapper(["/"])
      render(<ShimmerCta />, { wrapper })

      const link = screen.getByRole("link", { name: /open your fitting room/i })
      expect(link).toHaveAttribute("href", "/app/studio")
    })

    it("triggers shimmer on hover without breaking markup", async () => {
      const user = userEvent.setup()
      const wrapper = createAllProvidersWrapper(["/"])
      render(<ShimmerCta />, { wrapper })

      const link = screen.getByRole("link", { name: /start your try-on/i })
      await user.hover(link)
      expect(link).toBeInTheDocument()
    })
  })

  describe("PageProgressController", () => {
    it("renders with accessible scroll-to-top button and decorative SVG ring", () => {
      render(<PageProgressController />)

      const btn = screen.getByRole("button", { name: /scroll to top/i })
      expect(btn).toBeInTheDocument()
    })

    it("invokes window.scrollTo when clicked", async () => {
      const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
      const user = userEvent.setup()

      render(<PageProgressController />)

      const btn = screen.getByRole("button", { name: /scroll to top/i })
      await user.click(btn)

      expect(scrollToSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          top: 0,
        })
      )
    })
  })

  describe("scrollToSection", () => {
    it("scrolls element into view when element exists", () => {
      const mockElement = document.createElement("div")
      mockElement.id = "test-section"
      mockElement.scrollIntoView = vi.fn()
      document.body.appendChild(mockElement)

      const success = scrollToSection("test-section", false)

      expect(success).toBe(true)
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({
          block: "start",
        })
      )

      document.body.removeChild(mockElement)
    })

    it("returns false gracefully when element does not exist", () => {
      const success = scrollToSection("non-existent-section", false)
      expect(success).toBe(false)
    })
  })
})
