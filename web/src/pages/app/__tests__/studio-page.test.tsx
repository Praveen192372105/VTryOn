import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import StudioPage from "../studio-page"
import { createAllProvidersWrapper } from "../../../test/render"

vi.mock("../../../features/uploads", () => ({
  useCurrentPersonUpload: () => ({
    selectedId: null,
    selectedUpload: null,
    setSelectedId: vi.fn(),
    clearSelection: vi.fn(),
  }),
  usePersonUploads: () => ({
    uploads: [],
    isLoading: false,
  }),
  useCreatePersonUpload: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

vi.mock("../../../features/outfits", () => ({
  useCurrentOutfit: () => ({
    selectedId: null,
    selectedOutfit: null,
    setSelectedId: vi.fn(),
    clearSelection: vi.fn(),
  }),
  useOutfit: () => ({
    data: null,
    isLoading: false,
    isError: false,
  }),
  useOutfits: () => ({
    data: { items: [], pagination: { total: 0, page: 1, page_size: 24, total_pages: 0 } },
    isLoading: false,
  }),
}))

describe("StudioPage", () => {
  it("renders page header with canonical title and description", () => {
    const wrapper = createAllProvidersWrapper(["/app/studio"])
    render(<StudioPage />, { wrapper })

    expect(screen.getByRole("heading", { name: "Studio", level: 1 })).toBeInTheDocument()
    expect(
      screen.getByText("Choose your photo and an outfit to create a virtual try-on.")
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Generate Try-On/i })).toBeInTheDocument()
  })
})
