import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import { useToggleFavorite } from "../use-toggle-favorite"
import { outfitKeys } from "../../../outfits/query-keys"
import { favoriteKeys } from "../../query-keys"
import * as favoritesApi from "../../api"
import type { OutfitListResponse } from "../../../outfits/types"

vi.mock("../../api", () => ({
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  listFavorites: vi.fn(),
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe("useToggleFavorite", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it("optimistically updates catalogue cache when favoriting an outfit", async () => {
    const initialList: OutfitListResponse = {
      items: [
        {
          id: "out_1",
          name: "Silk Shirt",
          slug: "silk-shirt",
          category: "upper_body",
          image_url: "/media/outfits/shirt.jpg",
          is_favorite: false,
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
      pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
    }

    queryClient.setQueryData(outfitKeys.list(), initialList)
    vi.mocked(favoritesApi.addFavorite).mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useToggleFavorite(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({
        outfitId: "out_1",
        currentIsFavorite: false,
        outfit: initialList.items[0],
      })
    })

    const cached = queryClient.getQueryData<OutfitListResponse>(outfitKeys.list())
    expect(cached?.items[0].is_favorite).toBe(true)
    expect(favoritesApi.addFavorite).toHaveBeenCalledWith("out_1")
  })

  it("rolls back optimistic update when server fails", async () => {
    const initialList: OutfitListResponse = {
      items: [
        {
          id: "out_2",
          name: "Linen Trousers",
          slug: "linen-trousers",
          category: "lower_body",
          image_url: "/media/outfits/pants.jpg",
          is_favorite: false,
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
      pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
    }

    queryClient.setQueryData(outfitKeys.list(), initialList)
    vi.mocked(favoritesApi.addFavorite).mockRejectedValueOnce(new Error("Server error"))

    const { result } = renderHook(() => useToggleFavorite(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({
          outfitId: "out_2",
          currentIsFavorite: false,
          outfit: initialList.items[0],
        })
      } catch {
        // Handled by test
      }
    })

    // Expect rollback to initial is_favorite: false
    const cached = queryClient.getQueryData<OutfitListResponse>(outfitKeys.list())
    expect(cached?.items[0].is_favorite).toBe(false)
  })

  it("optimistically removes outfit from favorites list when unfavoriting", async () => {
    const initialFavorites = {
      items: [
        {
          outfit: {
            id: "out_3",
            name: "Summer Dress",
            slug: "summer-dress",
            category: "dresses" as const,
            image_url: "/media/outfits/dress.jpg",
            is_favorite: true,
            created_at: "2026-01-01T00:00:00Z",
          },
          favorited_at: "2026-01-02T00:00:00Z",
        },
      ],
      pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
    }

    queryClient.setQueryData(favoriteKeys.list(), initialFavorites)
    vi.mocked(favoritesApi.removeFavorite).mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useToggleFavorite(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({
        outfitId: "out_3",
        currentIsFavorite: true,
      })
    })

    const cached = queryClient.getQueryData<typeof initialFavorites>(favoriteKeys.list())
    expect(cached?.items.length).toBe(0)
    expect(favoritesApi.removeFavorite).toHaveBeenCalledWith("out_3")
  })
})
