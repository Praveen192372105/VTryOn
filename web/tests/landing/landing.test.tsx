import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import fs from "fs"
import path from "path"
import LandingPage from "../../src/pages/public/landing-page"
import { createAllProvidersWrapper } from "../../src/test/render"
import * as authHook from "../../src/features/auth/use-auth"
import type { AuthContextType } from "../../src/features/auth/types"

const LANDING_FEATURE_DIR = path.resolve(__dirname, "../../src/features/landing")

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

describe("Landing Page — Phase 3 & Refinement Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders exactly 14 major sections with valid sequence markers", () => {
    const wrapper = createAllProvidersWrapper(["/"])
    const { container } = render(<LandingPage />, { wrapper })

    const expectedSections = [
      "01", "02", "03", "04", "05", "06", "07",
      "08", "09", "10", "11", "12", "13", "14",
    ]

    for (const sec of expectedSections) {
      const el = container.querySelector(`[data-section="${sec}"]`)
      expect(el, `Section ${sec} should exist in DOM`).not.toBeNull()
    }

    const allSections = container.querySelectorAll("[data-section]")
    expect(allSections.length).toBe(14)
  })

  it("enforces single H1 heading with stable centered copy", () => {
    const wrapper = createAllProvidersWrapper(["/"])
    const { container } = render(<LandingPage />, { wrapper })

    const h1Elements = container.querySelectorAll("h1")
    expect(h1Elements.length).toBe(1)
    expect(h1Elements[0].textContent).toContain("See the outfit on you.")

    const h2Elements = container.querySelectorAll("h2")
    expect(h2Elements.length).toBeGreaterThanOrEqual(13)
  })

  it("renders animated typing headline with accessible stable text", () => {
    const wrapper = createAllProvidersWrapper(["/"])
    render(<LandingPage />, { wrapper })

    expect(
      screen.getByText(/V Try-On lets you visualize selected outfits using your own photo/i)
    ).toBeInTheDocument()
  })

  it("routes logged-out visitors to /register for primary CTA", () => {
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
    render(<LandingPage />, { wrapper })

    const startButtons = screen.getAllByRole("link", { name: /start your try-on/i })
    expect(startButtons.length).toBeGreaterThanOrEqual(1)
    expect(startButtons[0].getAttribute("href")).toBe("/register")
  })

  it("routes authenticated visitors to /app/studio for primary CTA", () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: { id: "u1", email: "user@example.com", name: "Jane" },
      status: "authenticated",
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    } as AuthContextType)

    const wrapper = createAllProvidersWrapper(["/"])
    render(<LandingPage />, { wrapper })

    const openStudioLinks = screen.getAllByRole("link", { name: /open/i })
    expect(openStudioLinks.length).toBeGreaterThanOrEqual(1)
    const hasStudioLink = openStudioLinks.some(
      (link) => link.getAttribute("href") === "/app/studio"
    )
    expect(hasStudioLink).toBe(true)
  })

  it("renders the primary anchor navigation links", () => {
    const wrapper = createAllProvidersWrapper(["/"])
    const { container } = render(<LandingPage />, { wrapper })

    const expectedAnchors = ["#how-it-works", "#experience", "#privacy", "#trust"]
    for (const anchor of expectedAnchors) {
      const link = container.querySelector(`a[href="${anchor}"]`)
      expect(link, `Link to ${anchor} should be present`).not.toBeNull()
    }
  })

  it("renders floating page progress controller with accessible scroll-to-top button", () => {
    const wrapper = createAllProvidersWrapper(["/"])
    render(<LandingPage />, { wrapper })

    const scrollTopBtn = screen.getByRole("button", { name: /scroll to top/i })
    expect(scrollTopBtn).toBeInTheDocument()
  })

  it("strictly audits that zero raster images (.jpg, .png, .webp, background-image) are used in landing", () => {
    const landingFiles = getFilesRecursively(LANDING_FEATURE_DIR)
    landingFiles.push(path.resolve(__dirname, "../../src/pages/public/landing-page.tsx"))

    const violations: { file: string; match: string }[] = []
    const rasterPattern = /\.(jpg|jpeg|png|webp)|background-image:\s*url/i

    for (const file of landingFiles) {
      const content = fs.readFileSync(file, "utf-8")
      const match = content.match(rasterPattern)
      if (match) {
        violations.push({ file: path.basename(file), match: match[0] })
      }
    }

    expect(violations).toEqual([])
  })

  it("strictly audits that no unauthorized icon libraries are imported in landing", () => {
    const landingFiles = getFilesRecursively(LANDING_FEATURE_DIR)
    landingFiles.push(path.resolve(__dirname, "../../src/pages/public/landing-page.tsx"))

    const bannedLibs = ["lucide-react", "react-icons", "@mui/icons-material", "@heroicons/react"]
    const violations: { file: string; library: string }[] = []

    for (const file of landingFiles) {
      const content = fs.readFileSync(file, "utf-8")
      for (const lib of bannedLibs) {
        if (content.includes(`"${lib}"`) || content.includes(`'${lib}'`)) {
          violations.push({ file: path.basename(file), library: lib })
        }
      }
    }

    expect(violations).toEqual([])
  })

  it("strictly renders procedural pattern fields marked aria-hidden and pointer-events-none", () => {
    const wrapper = createAllProvidersWrapper(["/"])
    const { container } = render(<LandingPage />, { wrapper })

    const patternElements = container.querySelectorAll("[aria-hidden='true'].pointer-events-none")
    expect(patternElements.length).toBeGreaterThanOrEqual(14)
  })
})
