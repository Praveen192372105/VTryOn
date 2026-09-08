import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { OutfitCard } from "../outfit-card"
import type { OutfitListItem } from "../../types"

// Mock FavoriteButton to isolate card tests
vi.mock("../../../favorites/components/favorite-button", () => ({
  FavoriteButton: ({ outfitId, isFavorite }: any) => (
    <button aria-label="Mock Favorite Button" data-outfit-id={outfitId} aria-pressed={isFavorite}>
      Fav
    </button>
  ),
}))

describe("OutfitCard", () => {
  const mockOutfit: OutfitListItem = {
    id: "out_test_1",
    name: "Cashmere Cardigan",
    slug: "cashmere-cardigan",
    category: "upper_body",
    image_url: "/media/outfits/cardigan.jpg",
    is_favorite: false,
    created_at: "2026-03-01T12:00:00Z",
  }

  it("renders outfit name, category, and garment image alt text", () => {
    render(
      <OutfitCard
        outfit={mockOutfit}
        onOpenDetail={vi.fn()}
        onSelectForStudio={vi.fn()}
      />
    )

    expect(screen.getByText("Cashmere Cardigan")).toBeInTheDocument()
    expect(screen.getByText("Tops")).toBeInTheDocument()
    expect(screen.getByAltText("Cashmere Cardigan garment")).toBeInTheDocument()
  })

  it("triggers onOpenDetail when card image or title is clicked", () => {
    const handleOpenDetail = vi.fn()
    render(
      <OutfitCard
        outfit={mockOutfit}
        onOpenDetail={handleOpenDetail}
        onSelectForStudio={vi.fn()}
      />
    )

    const viewButton = screen.getByRole("button", { name: /View details for Cashmere Cardigan/i })
    fireEvent.click(viewButton)

    expect(handleOpenDetail).toHaveBeenCalledWith("out_test_1")
  })

  it("triggers onSelectForStudio when Try this outfit CTA is clicked", () => {
    const handleSelectForStudio = vi.fn()
    render(
      <OutfitCard
        outfit={mockOutfit}
        onOpenDetail={vi.fn()}
        onSelectForStudio={handleSelectForStudio}
      />
    )

    const tryButton = screen.getByRole("button", { name: /Try this outfit/i })
    fireEvent.click(tryButton)

    expect(handleSelectForStudio).toHaveBeenCalledWith(mockOutfit)
  })

  it("renders Selected badge when marked as current Studio outfit", () => {
    render(
      <OutfitCard
        outfit={mockOutfit}
        isSelectedForStudio={true}
        onOpenDetail={vi.fn()}
        onSelectForStudio={vi.fn()}
      />
    )

    expect(screen.getByText("Selected")).toBeInTheDocument()
  })
})
