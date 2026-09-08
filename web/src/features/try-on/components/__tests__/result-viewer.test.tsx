import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ResultViewer } from "../result-viewer"
import { apiClient } from "@/lib/api/client"
import { clearSelectedOutfit } from "../../../outfits"
import { createAllProvidersWrapper } from "@/test/render"
import type { TryOnJob } from "../../types"

vi.mock("../../../outfits", () => ({
  clearSelectedOutfit: vi.fn(),
}))

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

describe("ResultViewer", () => {
  const succeededJob: TryOnJob = {
    id: "job_success_1",
    person_upload_id: "upl_1",
    outfit_id: "out_1",
    status: "succeeded",
    result: {
      id: "res_1",
      image_url: "/api/v1/try-ons/job_success_1/content",
      width: 768,
      height: 1024,
      created_at: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    window.URL.createObjectURL = vi.fn(() => "blob:mock-result-image")
    window.URL.revokeObjectURL = vi.fn()
  })

  it("renders succeeded result, status badge, and action affordances", async () => {
    const mockBlob = new Blob(["image-data"], { type: "image/jpeg" })
    vi.spyOn(apiClient, "get").mockResolvedValue({ data: mockBlob })

    const wrapper = createAllProvidersWrapper(["/app/try-ons/job_success_1"])
    render(
      <ResultViewer
        job={succeededJob}
        personImageUrl="https://example.com/original.jpg"
        outfitName="Evening Tuxedo"
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Your look is ready")).toBeInTheDocument()
    })
    expect(screen.getByText("Evening Tuxedo")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Try another outfit/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /New try-on/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Download look/i })).toBeInTheDocument()

    // Compare toggle exists when original portrait is provided
    expect(screen.getByRole("button", { name: /Compare with Original/i })).toBeInTheDocument()
  })

  it("toggles to comparison view and back to result view", async () => {
    const mockBlob = new Blob(["image-data"], { type: "image/jpeg" })
    vi.spyOn(apiClient, "get").mockResolvedValue({ data: mockBlob })

    const wrapper = createAllProvidersWrapper(["/app/try-ons/job_success_1"])
    render(
      <ResultViewer
        job={succeededJob}
        personImageUrl="https://example.com/original.jpg"
        outfitName="Evening Tuxedo"
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled()
    })

    const compareBtn = screen.getByRole("button", { name: /Compare with Original/i })
    fireEvent.click(compareBtn)

    // Slider for comparison is rendered asynchronously via Suspense
    expect(await screen.findByRole("slider", { name: /Comparison position/i })).toBeInTheDocument()

    const resultBtn = screen.getByRole("button", { name: /Result/i })
    fireEvent.click(resultBtn)

    await waitFor(() => {
      expect(screen.queryByRole("slider")).not.toBeInTheDocument()
    })
  })

  it("invokes clearSelectedOutfit when 'Try another outfit' is clicked", async () => {
    const mockBlob = new Blob(["image-data"], { type: "image/jpeg" })
    vi.spyOn(apiClient, "get").mockResolvedValue({ data: mockBlob })

    const wrapper = createAllProvidersWrapper(["/app/try-ons/job_success_1"])
    render(
      <ResultViewer
        job={succeededJob}
        personImageUrl="https://example.com/original.jpg"
      />,
      { wrapper }
    )

    const tryAnotherBtn = await screen.findByRole("button", { name: /Try another outfit/i })
    fireEvent.click(tryAnotherBtn)

    expect(clearSelectedOutfit).toHaveBeenCalledTimes(1)
  })

  it("triggers authenticated download when 'Download look' is clicked", async () => {
    const mockBlob = new Blob(["binary-image-data"], { type: "image/jpeg" })
    vi.spyOn(apiClient, "get").mockResolvedValue({ data: mockBlob })

    const wrapper = createAllProvidersWrapper(["/app/try-ons/job_success_1"])
    render(
      <ResultViewer
        job={succeededJob}
        personImageUrl="https://example.com/original.jpg"
      />,
      { wrapper }
    )

    const downloadBtn = screen.getByRole("button", { name: /Download look/i })
    fireEvent.click(downloadBtn)

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/try-ons/job_success_1/content"),
        { responseType: "blob" }
      )
    })
  })
})
