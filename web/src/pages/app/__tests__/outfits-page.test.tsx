import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import OutfitsPage from "../outfits-page"
import * as outfitsHook from "../../../features/outfits/hooks/use-outfits"
import * as currentOutfitHook from "../../../features/outfits/hooks/use-current-outfit"

vi.mock("../../../features/outfits/hooks/use-outfits", () => ({
  useOutfits: vi.fn(),
  useOutfit: vi.fn(),
}))

vi.mock("../../../features/outfits/hooks/use-current-outfit", () => ({
  useCurrentOutfit: vi.fn(),
}))

vi.mock("../../../features/favorites/components/favorite-button", () => ({
  FavoriteButton: () => <button aria-label="Mock Favorite">Fav</button>,
}))

describe("OutfitsPage", () => {
  const mockOutfitsData = {
    items: [
      {
        id: "out_1",
        name: "Classic Trench",
        slug: "classic-trench",
        category: "upper_body" as const,
        image_url: "/media/outfits/trench.jpg",
        is_favorite: false,
        created_at: "2026-01-01T00:00:00Z",
      },
    ],
    pagination: { page: 1, page_size: 24, total: 1, total_pages: 1 },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(outfitsHook.useOutfits).mockReturnValue({
      data: mockOutfitsData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    vi.mocked(outfitsHook.useOutfit).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    vi.mocked(currentOutfitHook.useCurrentOutfit).mockReturnValue({
      selectedId: null,
      selectedOutfit: null,
      setSelectedId: vi.fn(),
      clearSelection: vi.fn(),
    } as any)
  })

  it("renders page header and catalogue outfits", () => {
    render(
      <MemoryRouter initialEntries={["/app/outfits"]}>
        <OutfitsPage />
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { name: "Outfits" })).toBeInTheDocument()
    expect(screen.getByText("Classic Trench")).toBeInTheDocument()
    expect(screen.getAllByText("Tops").length).toBeGreaterThanOrEqual(1)
  })

  it("renders empty state when catalogue contains 0 outfits", () => {
    vi.mocked(outfitsHook.useOutfits).mockReturnValue({
      data: { items: [], pagination: { page: 1, page_size: 24, total: 0, total_pages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(
      <MemoryRouter initialEntries={["/app/outfits"]}>
        <OutfitsPage />
      </MemoryRouter>
    )

    expect(screen.getByText("No outfits are available right now.")).toBeInTheDocument()
  })
})
