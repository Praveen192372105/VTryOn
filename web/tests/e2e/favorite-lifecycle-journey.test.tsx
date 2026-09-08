import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "../../src/features/auth"
import OutfitsPage from "../../src/pages/app/outfits-page"
import FavoritesPage from "../../src/pages/app/favorites-page"
import { tokenStore } from "../../src/lib/auth/token-store"
import * as authApi from "../../src/features/auth/api"
import * as listOutfitsApi from "../../src/features/outfits/api/list-outfits"
import * as addFavoriteApi from "../../src/features/favorites/api/add-favorite"
import * as removeFavoriteApi from "../../src/features/favorites/api/remove-favorite"
import * as listFavoritesApi from "../../src/features/favorites/api/list-favorites"
import { mockOutfitSilkShirt, mockOutfitListResponse } from "../../src/test/fixtures/outfit-fixtures"

describe("E2E Journey: Favorite / Unfavorite Lifecycle", () => {
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

    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue({
      id: "usr_1",
      name: "Alex Designer",
      email: "alex@example.com",
    })

    vi.spyOn(listOutfitsApi, "listOutfits").mockResolvedValue(mockOutfitListResponse)
    vi.spyOn(listFavoritesApi, "listFavorites").mockResolvedValue({
      items: [
        {
          outfit: { ...mockOutfitSilkShirt, is_favorite: true },
          favorited_at: "2026-09-05T00:00:00.000Z",
        },
      ],
      pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
    })
    vi.spyOn(addFavoriteApi, "addFavorite").mockResolvedValue(undefined)
    vi.spyOn(removeFavoriteApi, "removeFavorite").mockResolvedValue(undefined)
  })

  afterEach(() => {
    tokenStore.clearTokens()
  })

  it("handles browsing catalogue, favoriting, and viewing in favorites", async () => {
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={["/app/outfits"]}>
            <Routes>
              <Route path="/app/outfits" element={<OutfitsPage />} />
              <Route path="/app/favorites" element={<FavoritesPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    )

    // 1. Catalog renders
    expect(await screen.findByRole("heading", { name: /Outfits/i, level: 1 })).toBeInTheDocument()

    // 2. Favorite button for Silk Oxford Shirt
    const favBtn = await screen.findByRole("button", {
      name: /Add Silk Oxford Shirt to favorites/i,
    })
    expect(favBtn).toBeInTheDocument()
    expect(favBtn).toHaveAttribute("aria-pressed", "false")

    // 3. Click to favorite
    fireEvent.click(favBtn)
    await waitFor(() => {
      expect(addFavoriteApi.addFavorite).toHaveBeenCalledWith(mockOutfitSilkShirt.id)
    })

    unmount()

    // 4. View in Saved Favorites
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={["/app/favorites"]}>
            <Routes>
              <Route path="/app/favorites" element={<FavoritesPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    )

    expect(await screen.findByRole("heading", { name: /^Favorites$/i, level: 1 })).toBeInTheDocument()
    expect(
      await screen.findByRole("heading", { name: "Silk Oxford Shirt", level: 3 })
    ).toBeInTheDocument()

    // 5. Unfavorite from saved page
    const removeBtn = await screen.findByRole("button", {
      name: /Remove Silk Oxford Shirt from favorites/i,
    })
    fireEvent.click(removeBtn)
    await waitFor(() => {
      expect(removeFavoriteApi.removeFavorite).toHaveBeenCalledWith(mockOutfitSilkShirt.id)
    })
  })
})
