import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { MemoryRouter, useLocation } from "react-router-dom"
import React from "react"
import { useOutfitFilters } from "../use-outfit-filters"

function createWrapper(initialEntries: string[] = ["/app/outfits"]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    )
  }
}

describe("useOutfitFilters", () => {
  it("parses default parameters when URL has no query parameters", () => {
    const { result } = renderHook(() => useOutfitFilters(), {
      wrapper: createWrapper(["/app/outfits"]),
    })

    expect(result.current.category).toBeUndefined()
    expect(result.current.page).toBe(1)
    expect(result.current.search).toBeUndefined()
    expect(result.current.detailOutfitId).toBeNull()
  })

  it("parses valid category and page from search params", () => {
    const { result } = renderHook(() => useOutfitFilters(), {
      wrapper: createWrapper(["/app/outfits?category=upper_body&page=3&search=jacket"]),
    })

    expect(result.current.category).toBe("upper_body")
    expect(result.current.page).toBe(3)
    expect(result.current.search).toBe("jacket")
  })

  it("safely normalizes invalid category and invalid page values", () => {
    const { result } = renderHook(() => useOutfitFilters(), {
      wrapper: createWrapper(["/app/outfits?category=shoes&page=-5"]),
    })

    // Unsupported category normalized to undefined (not sent to backend)
    expect(result.current.category).toBeUndefined()
    // Negative/invalid page normalized to 1
    expect(result.current.page).toBe(1)
  })

  it("resets page to 1 when category is changed", () => {
    const { result } = renderHook(
      () => {
        const filters = useOutfitFilters()
        const location = useLocation()
        return { filters, location }
      },
      { wrapper: createWrapper(["/app/outfits?category=upper_body&page=4"]) }
    )

    expect(result.current.filters.page).toBe(4)

    act(() => {
      result.current.filters.setCategory("dresses")
    })

    expect(result.current.filters.category).toBe("dresses")
    expect(result.current.filters.page).toBe(1)
    expect(result.current.location.search).toContain("category=dresses")
    expect(result.current.location.search).not.toContain("page=")
  })

  it("updates page without dropping category or search", () => {
    const { result } = renderHook(
      () => {
        const filters = useOutfitFilters()
        const location = useLocation()
        return { filters, location }
      },
      { wrapper: createWrapper(["/app/outfits?category=lower_body&search=denim"]) }
    )

    act(() => {
      result.current.filters.setPage(2)
    })

    expect(result.current.filters.page).toBe(2)
    expect(result.current.filters.category).toBe("lower_body")
    expect(result.current.filters.search).toBe("denim")
    expect(result.current.location.search).toContain("page=2")
  })

  it("updates and removes detail outfit ID", () => {
    const { result } = renderHook(
      () => {
        const filters = useOutfitFilters()
        const location = useLocation()
        return { filters, location }
      },
      { wrapper: createWrapper(["/app/outfits?category=upper_body"]) }
    )

    act(() => {
      result.current.filters.setDetailOutfitId("out_12345")
    })

    expect(result.current.filters.detailOutfitId).toBe("out_12345")
    expect(result.current.location.search).toContain("outfit=out_12345")

    act(() => {
      result.current.filters.setDetailOutfitId(null)
    })

    expect(result.current.filters.detailOutfitId).toBeNull()
    expect(result.current.location.search).not.toContain("outfit=")
  })
})
