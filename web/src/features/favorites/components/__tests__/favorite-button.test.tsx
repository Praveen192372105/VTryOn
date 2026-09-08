import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { FavoriteButton } from "../favorite-button"
import * as toggleFavHook from "../../hooks/use-toggle-favorite"

vi.mock("../../hooks/use-toggle-favorite", () => ({
  useToggleFavorite: vi.fn(),
}))

describe("FavoriteButton", () => {
  const mockMutate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(toggleFavHook.useToggleFavorite).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      variables: undefined,
    } as any)
  })

  it("renders with accessible add label when isFavorite is false", () => {
    render(<FavoriteButton outfitId="out_1" isFavorite={false} outfitName="Silk Blouse" />)

    const button = screen.getByRole("button", { name: /Add Silk Blouse to favorites/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute("aria-pressed", "false")
  })

  it("renders with accessible remove label when isFavorite is true", () => {
    render(<FavoriteButton outfitId="out_1" isFavorite={true} outfitName="Silk Blouse" />)

    const button = screen.getByRole("button", { name: /Remove Silk Blouse from favorites/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute("aria-pressed", "true")
  })

  it("calls mutate with current outfit parameters on click", () => {
    render(<FavoriteButton outfitId="out_1" isFavorite={false} outfitName="Silk Blouse" />)

    const button = screen.getByRole("button")
    fireEvent.click(button)

    expect(mockMutate).toHaveBeenCalledWith({
      outfitId: "out_1",
      currentIsFavorite: false,
      outfit: undefined,
    })
  })

  it("disables button when mutation is pending for this outfit", () => {
    vi.mocked(toggleFavHook.useToggleFavorite).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      variables: { outfitId: "out_1", currentIsFavorite: false },
    } as any)

    render(<FavoriteButton outfitId="out_1" isFavorite={false} outfitName="Silk Blouse" />)

    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
  })

  it("remains enabled if mutation is pending for a different outfit", () => {
    vi.mocked(toggleFavHook.useToggleFavorite).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      variables: { outfitId: "out_other", currentIsFavorite: false },
    } as any)

    render(<FavoriteButton outfitId="out_1" isFavorite={false} outfitName="Silk Blouse" />)

    const button = screen.getByRole("button")
    expect(button).not.toBeDisabled()
  })
})
