import { useMemo, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import type { OutfitCategory } from "../types"
import { OUTFIT_CATEGORIES } from "../constants"

export interface OutfitFiltersState {
  category: OutfitCategory | undefined
  page: number
  search: string | undefined
  detailOutfitId: string | null
}

export function useOutfitFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const state: OutfitFiltersState = useMemo(() => {
    // 1. Validate Category
    const rawCategory = searchParams.get("category")
    const category: OutfitCategory | undefined =
      rawCategory && (OUTFIT_CATEGORIES as readonly string[]).includes(rawCategory)
        ? (rawCategory as OutfitCategory)
        : undefined

    // 2. Validate Page
    const rawPage = searchParams.get("page")
    const parsedPage = rawPage ? parseInt(rawPage, 10) : 1
    const page = !isNaN(parsedPage) && parsedPage >= 1 ? parsedPage : 1

    // 3. Search Term
    const rawSearch = searchParams.get("search")
    const search = rawSearch && rawSearch.trim().length > 0 ? rawSearch.trim() : undefined

    // 4. Detail Outfit Public ID
    const rawOutfit = searchParams.get("outfit")
    const detailOutfitId = rawOutfit && rawOutfit.trim().length > 0 ? rawOutfit.trim() : null

    return {
      category,
      page,
      search,
      detailOutfitId,
    }
  }, [searchParams])

  const setCategory = useCallback(
    (newCategory: OutfitCategory | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (newCategory && (OUTFIT_CATEGORIES as readonly string[]).includes(newCategory)) {
            next.set("category", newCategory)
          } else {
            next.delete("category")
          }
          // Changing category always resets pagination to page 1
          next.delete("page")
          return next
        },
        { replace: false }
      )
    },
    [setSearchParams]
  )

  const setPage = useCallback(
    (newPage: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (newPage > 1) {
            next.set("page", newPage.toString())
          } else {
            next.delete("page")
          }
          return next
        },
        { replace: false }
      )
    },
    [setSearchParams]
  )

  const setSearch = useCallback(
    (term: string | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const trimmed = term?.trim()
          if (trimmed && trimmed.length > 0) {
            next.set("search", trimmed)
          } else {
            next.delete("search")
          }
          // Changing search resets pagination to page 1
          next.delete("page")
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const setDetailOutfitId = useCallback(
    (id: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (id && id.trim().length > 0) {
            next.set("outfit", id.trim())
          } else {
            next.delete("outfit")
          }
          return next
        },
        { replace: false }
      )
    },
    [setSearchParams]
  )

  const clearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams()
        // Preserve open detail modal if any
        const currentDetail = prev.get("outfit")
        if (currentDetail) {
          next.set("outfit", currentDetail)
        }
        return next
      },
      { replace: false }
    )
  }, [setSearchParams])

  return {
    ...state,
    setCategory,
    setPage,
    setSearch,
    setDetailOutfitId,
    clearFilters,
  }
}
