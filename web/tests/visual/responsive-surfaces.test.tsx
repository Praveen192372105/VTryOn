import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "../../src/features/auth"
import { AppLayout } from "../../src/components/layout/app-layout"
import StudioPage from "../../src/pages/app/studio-page"
import { ResultViewer } from "../../src/features/try-on/components/result-viewer"
import { mockSucceededJob } from "../../src/test/fixtures/try-on-fixtures"
import { mockOutfitSilkShirt } from "../../src/test/fixtures/outfit-fixtures"
import * as authApi from "../../src/features/auth/api"
import * as listUploadsApi from "../../src/features/uploads/api/list-uploads"
import * as listOutfitsApi from "../../src/features/outfits/api/list-outfits"
import * as getOutfitApi from "../../src/features/outfits/api/get-outfit"
import { mockPersonUploadListResponse } from "../../src/test/fixtures/upload-fixtures"
import { mockOutfitListResponse } from "../../src/test/fixtures/outfit-fixtures"

vi.mock("../../src/features/auth/api")

/**
 * Visual / Responsive Verification Layer
 * Section 21: Key responsive structure for landing, studio, and result at phone, tablet, and desktop viewports.
 */

describe("Visual & Responsive Verification: Phone, Tablet & Desktop Viewports", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue({
      id: "usr_1",
      name: "Alex Designer",
      email: "alex@example.com",
    })
    vi.spyOn(listUploadsApi, "listUploads").mockResolvedValue(mockPersonUploadListResponse)
    vi.spyOn(listOutfitsApi, "listOutfits").mockResolvedValue(mockOutfitListResponse)
    vi.spyOn(getOutfitApi, "getOutfit").mockResolvedValue(mockOutfitSilkShirt)
  })

  function setViewport(width: number, height: number) {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width })
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: height })
    window.dispatchEvent(new Event("resize"))
  }

  describe("Phone Viewport (375x667)", () => {
    it("renders navigation bottom tab bar and mobile workspace elements", async () => {
      setViewport(375, 667)

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <MemoryRouter initialEntries={["/app/studio"]}>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/app/studio" element={<StudioPage />} />
                </Route>
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </QueryClientProvider>
      )

      // Mobile bottom navigation bar rendered for phone
      expect(
        await screen.findByRole("navigation", { name: /Mobile workspace navigation/i })
      ).toBeInTheDocument()
      // Studio page header rendered
      expect(await screen.findByRole("heading", { name: "Studio", level: 1 })).toBeInTheDocument()
    })

    it("renders result viewer with stacked mobile layout controls", () => {
      setViewport(375, 667)

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ResultViewer
              job={mockSucceededJob}
              personImageUrl="/media/person.jpg"
              outfitName={mockOutfitSilkShirt.name}
            />
          </MemoryRouter>
        </QueryClientProvider>
      )

      expect(screen.getByText("Your look is ready")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Download look/i })).toBeInTheDocument()

      // Responsive workspace grid defines grid-cols-1 for mobile
      const grid = container.querySelector(".grid-cols-1")
      expect(grid).toBeInTheDocument()
    })
  })

  describe("Tablet Viewport (768x1024)", () => {
    it("renders tablet layout structure with adaptive sidebar trigger and content padding", async () => {
      setViewport(768, 1024)

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <MemoryRouter initialEntries={["/app/studio"]}>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/app/studio" element={<StudioPage />} />
                </Route>
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </QueryClientProvider>
      )

      // Sidebar trigger present on tablet top header
      const sidebarButtons = await screen.findAllByRole("button", { name: /Toggle Sidebar/i })
      expect(sidebarButtons.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe("Desktop Viewport (1440x900)", () => {
    it("renders large comparison canvas and sticky side metadata column", () => {
      setViewport(1440, 900)

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ResultViewer
              job={mockSucceededJob}
              personImageUrl="/media/person.jpg"
              outfitName={mockOutfitSilkShirt.name}
            />
          </MemoryRouter>
        </QueryClientProvider>
      )

      // Large comparison canvas column (lg:col-span-7 / xl:col-span-8)
      const canvasCol = container.querySelector(".lg\\:col-span-7")
      expect(canvasCol).toBeInTheDocument()

      // Side metadata column (lg:col-span-5 / xl:col-span-4) with sticky positioning
      const metaCol = container.querySelector(".lg\\:sticky")
      expect(metaCol).toBeInTheDocument()
    })
  })
})
