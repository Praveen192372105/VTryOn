import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { TryOnComposer } from "../try-on-composer"
import * as createTryOnApi from "../../api/create-try-on"
import { createAllProvidersWrapper } from "../../../../test/render"
import type { TryOnJob } from "../../types"

vi.mock("../../api/create-try-on")

const mockStudioSelection = {
  personUploadId: null as string | null,
  outfitId: null as string | null,
  selectedUpload: null,
  selectedOutfit: null,
  setPersonUploadId: vi.fn((id: string | null) => {
    mockStudioSelection.personUploadId = id
  }),
  setOutfitId: vi.fn((id: string | null) => {
    mockStudioSelection.outfitId = id
  }),
  clearPersonUpload: vi.fn(),
  clearOutfit: vi.fn(),
  clearAll: vi.fn(),
}

vi.mock("../../hooks/use-studio-selection", () => ({
  useStudioSelection: () => mockStudioSelection,
}))

vi.mock("../../../uploads", () => ({
  useCurrentPersonUpload: () => ({
    selectedId: mockStudioSelection.personUploadId,
    selectedUpload: null,
    setSelectedId: mockStudioSelection.setPersonUploadId,
    clearSelection: mockStudioSelection.clearPersonUpload,
  }),
  usePersonUploads: () => ({
    uploads: [
      {
        id: "upl_123",
        original_filename: "my_portrait.jpg",
        image_url: "https://example.com/portrait.jpg",
        width: 768,
        height: 1024,
      },
    ],
    isLoading: false,
  }),
  useCreatePersonUpload: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

vi.mock("../../../outfits", () => ({
  useCurrentOutfit: () => ({
    selectedId: mockStudioSelection.outfitId,
    selectedOutfit: null,
    setSelectedId: mockStudioSelection.setOutfitId,
    clearSelection: mockStudioSelection.clearOutfit,
  }),
  useOutfit: (id: string) => ({
    data: id === "out_456" ? {
      id: "out_456",
      name: "Silk Blazer",
      category: "outerwear",
      image_url: "https://example.com/blazer.jpg",
    } : null,
    isLoading: false,
    isError: false,
  }),
  useOutfits: () => ({
    data: { items: [], pagination: { total: 0, page: 1, page_size: 24, total_pages: 0 } },
    isLoading: false,
  }),
}))

vi.mock("../../../favorites", () => ({
  FavoriteButton: () => <button data-testid="fav-btn">Fav</button>,
}))

describe("TryOnComposer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStudioSelection.personUploadId = null
    mockStudioSelection.outfitId = null
  })

  it("renders disabled Generate button and instructional copy when selections are missing", () => {
    const wrapper = createAllProvidersWrapper(["/app/studio"])
    render(<TryOnComposer />, { wrapper })

    const generateBtn = screen.getByRole("button", { name: /Generate Try-On/i })
    expect(generateBtn).toBeDisabled()
    expect(screen.getByText("Choose a photo and outfit to continue.")).toBeInTheDocument()
    expect(screen.getByText("No photo selected")).toBeInTheDocument()
    expect(screen.getByText("No outfit selected")).toBeInTheDocument()
  })

  it("enables Generate button when both person and outfit are selected", () => {
    mockStudioSelection.personUploadId = "upl_123"
    mockStudioSelection.outfitId = "out_456"

    const wrapper = createAllProvidersWrapper(["/app/studio"])
    render(<TryOnComposer />, { wrapper })

    const generateBtn = screen.getByRole("button", { name: /Generate Try-On/i })
    expect(generateBtn).toBeEnabled()
    expect(screen.getByText("Ready to create your look.")).toBeInTheDocument()
  })

  it("submits exactly once and prevents double submission on rapid clicks", async () => {
    mockStudioSelection.personUploadId = "upl_123"
    mockStudioSelection.outfitId = "out_456"

    const mockJob: TryOnJob = {
      id: "job_created_1",
      person_upload_id: "upl_123",
      outfit_id: "out_456",
      status: "queued",
      created_at: new Date().toISOString(),
    }

    let resolvePromise: (job: TryOnJob) => void
    const pendingPromise = new Promise<TryOnJob>((resolve) => {
      resolvePromise = resolve
    })

    const createSpy = vi.spyOn(createTryOnApi, "createTryOn").mockReturnValue(pendingPromise)
    const onJobCreated = vi.fn()

    const wrapper = createAllProvidersWrapper(["/app/studio"])
    render(<TryOnComposer onJobCreated={onJobCreated} />, { wrapper })

    const generateBtn = screen.getByRole("button", { name: /Generate Try-On/i })

    // Fire two rapid clicks
    fireEvent.click(generateBtn)
    fireEvent.click(generateBtn)

    // Button should now show pending copy and be disabled
    await waitFor(() => {
      expect(screen.getByText("Starting your try-on…")).toBeInTheDocument()
      expect(generateBtn).toBeDisabled()
    })

    // Resolve API call
    resolvePromise!(mockJob)

    await waitFor(() => {
      expect(onJobCreated).toHaveBeenCalledWith(mockJob)
    })

    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(createSpy).toHaveBeenCalledWith({
      person_upload_id: "upl_123",
      outfit_id: "out_456",
    })
  })

  it("preserves selection and renders safe error message when POST fails", async () => {
    mockStudioSelection.personUploadId = "upl_123"
    mockStudioSelection.outfitId = "out_456"

    vi.spyOn(createTryOnApi, "createTryOn").mockRejectedValue(
      new Error("Photo resolution is too small for try-on.")
    )

    const wrapper = createAllProvidersWrapper(["/app/studio"])
    render(<TryOnComposer />, { wrapper })

    const generateBtn = screen.getByRole("button", { name: /Generate Try-On/i })
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })

    expect(screen.getByText("Photo resolution is too small for try-on.")).toBeInTheDocument()
    // Selections remain preserved
    expect(mockStudioSelection.personUploadId).toBe("upl_123")
    expect(mockStudioSelection.outfitId).toBe("out_456")
  })
})
