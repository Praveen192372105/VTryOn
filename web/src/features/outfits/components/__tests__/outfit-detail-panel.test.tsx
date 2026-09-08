import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { OutfitDetailPanel } from "../outfit-detail-panel"
import * as outfitsHook from "../../hooks/use-outfits"

vi.mock("../../hooks/use-outfits", () => ({
  useOutfit: vi.fn(),
}))

vi.mock("../../../favorites/components/favorite-button", () => ({
  FavoriteButton: () => <button aria-label="Mock Favorite">Fav</button>,
}))

describe("OutfitDetailPanel", () => {
  it("renders detail content and handles Studio selection", () => {
    vi.mocked(outfitsHook.useOutfit).mockReturnValue({
      data: {
        id: "out_detail_1",
        name: "Pleated Midi Skirt",
        slug: "pleated-midi-skirt",
        category: "lower_body",
        description: "Classic high-waist pleated midi skirt with fluid movement.",
        image_url: "/media/outfits/skirt.jpg",
        is_active: true,
        is_favorite: false,
        created_at: "2026-01-01T00:00:00Z",
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    const handleSelectForStudio = vi.fn()
    const handleClose = vi.fn()

    render(
      <OutfitDetailPanel
        outfitId="out_detail_1"
        onClose={handleClose}
        onSelectForStudio={handleSelectForStudio}
      />
    )

    expect(screen.getAllByText("Pleated Midi Skirt").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Bottoms")).toBeInTheDocument()
    expect(screen.getByText("Classic high-waist pleated midi skirt with fluid movement.")).toBeInTheDocument()

    const tryButton = screen.getByRole("button", { name: /Try this outfit/i })
    fireEvent.click(tryButton)

    expect(handleSelectForStudio).toHaveBeenCalled()
  })

  it("renders 404 error state when outfit fails to load", () => {
    vi.mocked(outfitsHook.useOutfit).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error("Outfit not found"),
      refetch: vi.fn(),
    } as any)

    render(
      <OutfitDetailPanel
        outfitId="out_missing"
        onClose={vi.fn()}
        onSelectForStudio={vi.fn()}
      />
    )

    expect(screen.getByText(/This outfit could not be found/i)).toBeInTheDocument()
  })
})
