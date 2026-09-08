import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useDeleteTryOn } from "../use-delete-try-on"
import * as deleteTryOnApi from "../../api/delete-try-on"
import { createAllProvidersWrapper } from "../../../../test/render"
import { AppApiError } from "../../../../lib/api/errors"
import { toast } from "sonner"

vi.mock("../../api/delete-try-on")
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe("useDeleteTryOn hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calls deleteTryOn API and displays success toast", async () => {
    const deleteSpy = vi.spyOn(deleteTryOnApi, "deleteTryOn").mockResolvedValue(undefined)

    const wrapper = createAllProvidersWrapper(["/"])
    const { result } = renderHook(() => useDeleteTryOn(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync("job_123")
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(deleteSpy).toHaveBeenCalledTimes(1)
    expect(deleteSpy).toHaveBeenCalledWith("job_123")
    expect(toast.success).toHaveBeenCalledWith("Try-on deleted from history")
  })

  it("handles 409 active job conflict truthfully", async () => {
    const conflictError = new AppApiError({
      code: "TRYON_JOB_IN_PROGRESS",
      message: "Cannot delete active job",
      status: 409,
    })
    vi.spyOn(deleteTryOnApi, "deleteTryOn").mockRejectedValue(conflictError)

    const wrapper = createAllProvidersWrapper(["/"])
    const { result } = renderHook(() => useDeleteTryOn(), { wrapper })

    await act(async () => {
      try {
        await result.current.mutateAsync("job_active_1")
      } catch {
        // Expected
      }
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(toast.error).toHaveBeenCalledWith(
      "This try-on is still being created and can't be deleted yet."
    )
  })

  it("handles 404 not found error", async () => {
    const notFoundError = new AppApiError({
      code: "TRYON_NOT_FOUND",
      message: "Job not found",
      status: 404,
    })
    vi.spyOn(deleteTryOnApi, "deleteTryOn").mockRejectedValue(notFoundError)

    const wrapper = createAllProvidersWrapper(["/"])
    const { result } = renderHook(() => useDeleteTryOn(), { wrapper })

    await act(async () => {
      try {
        await result.current.mutateAsync("job_missing_1")
      } catch {
        // Expected
      }
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(toast.error).toHaveBeenCalledWith("This try-on could not be found.")
  })
})
