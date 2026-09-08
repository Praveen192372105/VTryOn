import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { OutfitPagination } from "../outfit-pagination"

describe("OutfitPagination", () => {
  it("renders nothing when totalPages is 1 or less", () => {
    const { container } = render(
      <OutfitPagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it("disables previous button on page 1 and enables next button", () => {
    render(
      <OutfitPagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />
    )

    const prevButton = screen.getByRole("button", { name: /Go to previous page/i })
    const nextButton = screen.getByRole("button", { name: /Go to next page/i })

    expect(prevButton).toBeDisabled()
    expect(nextButton).not.toBeDisabled()
  })

  it("marks current page with aria-current='page'", () => {
    render(
      <OutfitPagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />
    )

    const page3 = screen.getByRole("button", { name: "Page 3" })
    expect(page3).toHaveAttribute("aria-current", "page")

    const page2 = screen.getByRole("button", { name: "Page 2" })
    expect(page2).not.toHaveAttribute("aria-current")
  })

  it("calls onPageChange when next and page buttons are clicked", () => {
    const handlePageChange = vi.fn()
    render(
      <OutfitPagination currentPage={2} totalPages={5} onPageChange={handlePageChange} />
    )

    const nextButton = screen.getByRole("button", { name: /Go to next page/i })
    fireEvent.click(nextButton)
    expect(handlePageChange).toHaveBeenCalledWith(3)

    const page4 = screen.getByRole("button", { name: "Page 4" })
    fireEvent.click(page4)
    expect(handlePageChange).toHaveBeenCalledWith(4)
  })
})
