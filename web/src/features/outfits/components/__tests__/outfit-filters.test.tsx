import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { OutfitFilters } from "../outfit-filters"

describe("OutfitFilters", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders all category filter chips with correct active state", () => {
    render(
      <OutfitFilters
        selectedCategory="upper_body"
        onCategoryChange={vi.fn()}
        searchTerm={undefined}
        onSearchChange={vi.fn()}
      />
    )

    const allChip = screen.getByRole("button", { name: "All" })
    const topsChip = screen.getByRole("button", { name: "Tops" })
    const bottomsChip = screen.getByRole("button", { name: "Bottoms" })
    const dressesChip = screen.getByRole("button", { name: "Dresses" })

    expect(allChip).toHaveAttribute("aria-pressed", "false")
    expect(topsChip).toHaveAttribute("aria-pressed", "true")
    expect(bottomsChip).toHaveAttribute("aria-pressed", "false")
    expect(dressesChip).toHaveAttribute("aria-pressed", "false")
  })

  it("calls onCategoryChange when a category chip is clicked", () => {
    const handleCategoryChange = vi.fn()
    render(
      <OutfitFilters
        selectedCategory={undefined}
        onCategoryChange={handleCategoryChange}
        searchTerm={undefined}
        onSearchChange={vi.fn()}
      />
    )

    const dressesChip = screen.getByRole("button", { name: "Dresses" })
    fireEvent.click(dressesChip)

    expect(handleCategoryChange).toHaveBeenCalledWith("dresses")
  })

  it("debounces text search input before calling onSearchChange", () => {
    const handleSearchChange = vi.fn()
    render(
      <OutfitFilters
        selectedCategory={undefined}
        onCategoryChange={vi.fn()}
        searchTerm={undefined}
        onSearchChange={handleSearchChange}
      />
    )

    const input = screen.getByPlaceholderText("Search garments…")
    fireEvent.change(input, { target: { value: "wool jacket" } })

    // Immediately before timers advance: not called yet
    expect(handleSearchChange).not.toHaveBeenCalled()

    // Advance debounce timer
    act(() => {
      vi.advanceTimersByTime(350)
    })

    expect(handleSearchChange).toHaveBeenCalledWith("wool jacket")
  })

  it("clears search term when clear button is clicked", () => {
    const handleSearchChange = vi.fn()
    render(
      <OutfitFilters
        selectedCategory={undefined}
        onCategoryChange={vi.fn()}
        searchTerm="linen"
        onSearchChange={handleSearchChange}
      />
    )

    const clearButton = screen.getByRole("button", { name: /Clear search query/i })
    fireEvent.click(clearButton)

    expect(handleSearchChange).toHaveBeenCalledWith(undefined)
  })
})
