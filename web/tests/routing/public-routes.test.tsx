import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import HowItWorksPage from "@/pages/public/how-it-works-page"
import PrivacyPage from "@/pages/public/privacy-page"
import TermsPage from "@/pages/public/terms-page"
import * as authModule from "@/features/auth/use-auth"
import type { AuthContextType } from "@/features/auth/types"

describe("Standalone Public Routes", () => {
  const mockUnauthenticated: AuthContextType = {
    user: null,
    status: "unauthenticated",
    authReason: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    clearAuthReason: vi.fn(),
  }

  it("renders /how-it-works with educational pipeline and sizing disclaimer", () => {
    vi.spyOn(authModule, "useAuth").mockReturnValue(mockUnauthenticated)

    render(
      <MemoryRouter initialEntries={["/how-it-works"]}>
        <HowItWorksPage />
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { level: 1, name: /how virtual fitting works/i })).toBeInTheDocument()
    expect(screen.getByText(/Upload Silhouette Portrait/i)).toBeInTheDocument()
    expect(screen.getByText(/Select Curated Garments/i)).toBeInTheDocument()
    expect(screen.getByText(/Asynchronous GPU Synthesis/i)).toBeInTheDocument()
    expect(screen.getByText(/Fit & Sizing Accuracy Notice/i)).toBeInTheDocument()
  })

  it("renders /privacy with user-scoped media and deletion policy", () => {
    render(
      <MemoryRouter initialEntries={["/privacy"]}>
        <PrivacyPage />
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { level: 1, name: /privacy policy/i })).toBeInTheDocument()
    expect(screen.getByText(/Information We Collect and Process/i)).toBeInTheDocument()
    expect(screen.getByText(/Media Isolation and User Deletion/i)).toBeInTheDocument()
    expect(screen.getByText(/Zero Third-Party Tracking/i)).toBeInTheDocument()
  })

  it("renders /terms with synthetic visualization disclaimer and user obligations", () => {
    render(
      <MemoryRouter initialEntries={["/terms"]}>
        <TermsPage />
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { level: 1, name: /terms of service/i })).toBeInTheDocument()
    expect(screen.getByText(/No Sizing or Fit Guarantee/i)).toBeInTheDocument()
    expect(screen.getByText(/Uploaded Content Responsibilities/i)).toBeInTheDocument()
  })
})
