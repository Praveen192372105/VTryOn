import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import FavoritesPage from "../favorites-page"
import * as favoritesHook from "../../../features/favorites/hooks/use-favorites"
import * as currentOutfitHook from "../../../features/outfits/hooks/use-current-outfit"

vi.mock("../../../features/favorites/hooks/use-favorites", () => ({
  useFavorites: vi.fn(),
  useToggleFavorite: vi.fn(),
}))

vi.mock("../../../features/outfits/hooks/use-current-outfit", () => ({
  useCurrentOutfit: vi.fn(),
}))

vi.mock("../../../features/outfits/hooks/use-outfits", () => ({
  useOutfit: vi.fn().mockReturnValue({ data: null, isLoading: false }),
}))

vi.mock("../../../features/favorites/components/favorite-button", () => ({
  FavoriteButton: () => <button aria-label="Mock Favorite">Fav</button>,
}))

describe("FavoritesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(currentOutfitHook.useCurrentOutfit).mockReturnValue({
      selectedId: null,
      selectedOutfit: null,
      setSelectedId: vi.fn(),
      clearSelection: vi.fn(),
    } as any)
  })

  it("renders saved outfits from favorites API", () => {
    vi.mocked(favoritesHook.useFavorites).mockReturnValue({
      data: {
        items: [
          {
            outfit: {
              id: "out_fav_1",
              name: "Velvet Blazer",
              slug: "velvet-blazer",
              category: "upper_body" as const,
              image_url: "/media/outfits/blazer.jpg",
              is_favorite: true,
              created_at: "2026-01-01T00:00:00Z",
            },
            favorited_at: "2026-01-02T00:00:00Z",
          },
        ],
        pagination: { page: 1, page_size: 24, total: 1, total_pages: 1 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(
      <MemoryRouter initialEntries={["/app/favorites"]}>
        <FavoritesPage />
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { name: "Favorites" })).toBeInTheDocument()
    expect(screen.getByText("Velvet Blazer")).toBeInTheDocument()
  })

  it("renders empty state when user has no favorites", () => {
    vi.mocked(favoritesHook.useFavorites).mockReturnValue({
      data: { items: [], pagination: { page: 1, page_size: 24, total: 0, total_pages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(
      <MemoryRouter initialEntries={["/app/favorites"]}>
        <FavoritesPage />
      </MemoryRouter>
    )

    expect(screen.getByText("No saved outfits yet.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Browse outfits/i })).toBeInTheDocument()
  })
})
