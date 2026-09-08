import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import TryOnDetailPage from "../try-on-detail-page"
import * as useTryOnJobHook from "../../../features/try-on/hooks/use-try-on-job"
import { createAllProvidersWrapper } from "../../../test/render"
import type { TryOnJob } from "../../../features/try-on/types"

vi.mock("../../../features/uploads", () => ({
  usePersonUploads: () => ({ uploads: [] }),
}))

vi.mock("../../../features/outfits", () => ({
  useOutfit: () => ({ data: null }),
  clearSelectedOutfit: vi.fn(),
}))

describe("TryOnDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders loading state when job is being retrieved", () => {
    vi.spyOn(useTryOnJobHook, "useTryOnJob").mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any)

    const wrapper = createAllProvidersWrapper(["/app/try-ons/job_loading_1"])
    render(<TryOnDetailPage />, { wrapper })

    expect(screen.getByText(/Loading try-on details…/i)).toBeInTheDocument()
  })

  it("renders safe 404 ErrorState when try-on is not found", () => {
    vi.spyOn(useTryOnJobHook, "useTryOnJob").mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Not found"),
      refetch: vi.fn(),
    } as any)

    const wrapper = createAllProvidersWrapper(["/app/try-ons/job_missing_1"])
    render(<TryOnDetailPage />, { wrapper })

    expect(screen.getByText("This try-on could not be found")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Open Studio" })).toBeInTheDocument()
  })

  it("renders TryOnProcessing when job is queued or processing", () => {
    const processingJob: TryOnJob = {
      id: "job_proc_1",
      person_upload_id: "upl_1",
      outfit_id: "out_1",
      status: "processing",
      created_at: new Date().toISOString(),
    }

    vi.spyOn(useTryOnJobHook, "useTryOnJob").mockReturnValue({
      data: processingJob,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    const wrapper = createAllProvidersWrapper(["/app/try-ons/job_proc_1"])
    render(<TryOnDetailPage />, { wrapper })

    expect(screen.getByText("Creating your try-on")).toBeInTheDocument()
    expect(
      screen.getByText(/You can leave this page. Your try-on will continue processing in the background./i)
    ).toBeInTheDocument()
  })

  it("renders ResultViewer when job has succeeded", () => {
    const succeededJob: TryOnJob = {
      id: "job_succ_1",
      person_upload_id: "upl_1",
      outfit_id: "out_1",
      status: "succeeded",
      result: {
        id: "res_1",
        image_url: "/api/v1/try-ons/job_succ_1/content",
        width: 768,
        height: 1024,
        created_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    }

    vi.spyOn(useTryOnJobHook, "useTryOnJob").mockReturnValue({
      data: succeededJob,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    const wrapper = createAllProvidersWrapper(["/app/try-ons/job_succ_1"])
    render(<TryOnDetailPage />, { wrapper })

    expect(screen.getByText("Your look is ready")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Try another outfit/i })).toBeInTheDocument()
  })

  it("renders TryOnFailure when job has failed", () => {
    const failedJob: TryOnJob = {
      id: "job_failed_1",
      person_upload_id: "upl_1",
      outfit_id: "out_1",
      status: "failed",
      error: {
        code: "INVALID_INPUT",
        message: "Invalid pose",
      },
      created_at: new Date().toISOString(),
    }

    vi.spyOn(useTryOnJobHook, "useTryOnJob").mockReturnValue({
      data: failedJob,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    const wrapper = createAllProvidersWrapper(["/app/try-ons/job_failed_1"])
    render(<TryOnDetailPage />, { wrapper })

    expect(screen.getByText("We couldn't finish this try-on")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Try again in Studio/i })).toBeInTheDocument()
  })

  it("renders terminal delete button for succeeded job and triggers dialog", async () => {
    const succeededJob: TryOnJob = {
      id: "job_succ_delete",
      person_upload_id: "upl_1",
      outfit_id: "out_1",
      status: "succeeded",
      result: {
        id: "res_1",
        image_url: "/api/v1/try-ons/job_succ_delete/content",
        width: 768,
        height: 1024,
        created_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    }

    vi.spyOn(useTryOnJobHook, "useTryOnJob").mockReturnValue({
      data: succeededJob,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    const wrapper = createAllProvidersWrapper(["/app/try-ons/job_succ_delete"])
    render(<TryOnDetailPage />, { wrapper })

    const deleteBtn = screen.getByRole("button", { name: /Delete this try-on/i })
    expect(deleteBtn).toBeInTheDocument()
  })
})
