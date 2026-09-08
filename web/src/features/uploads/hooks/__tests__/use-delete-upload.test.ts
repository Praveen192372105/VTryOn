import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDeleteUpload } from "../use-delete-upload"
import * as deleteApi from "../../api/delete-upload"
import { createAllProvidersWrapper } from "../../../../test/render"
import { STORAGE_SELECTED_PERSON_KEY } from "../../constants"
import { AppApiError } from "@/lib/api/errors"

vi.mock("../../api/delete-upload")

describe("useDeleteUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("calls deleteUpload API and clears current selection if deleted ID was selected", async () => {
    localStorage.setItem(STORAGE_SELECTED_PERSON_KEY, "upl_to_delete")
    vi.spyOn(deleteApi, "deleteUpload").mockResolvedValue(undefined)

    const wrapper = createAllProvidersWrapper(["/app/uploads"])
    const { result } = renderHook(() => useDeleteUpload(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync("upl_to_delete")
    })

    expect(deleteApi.deleteUpload).toHaveBeenCalledWith("upl_to_delete")
    expect(localStorage.getItem(STORAGE_SELECTED_PERSON_KEY)).toBeNull()
  })

  it("preserves selection if a different upload was deleted", async () => {
    localStorage.setItem(STORAGE_SELECTED_PERSON_KEY, "upl_keep_this")
    vi.spyOn(deleteApi, "deleteUpload").mockResolvedValue(undefined)

    const wrapper = createAllProvidersWrapper(["/app/uploads"])
    const { result } = renderHook(() => useDeleteUpload(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync("upl_other")
    })

    expect(deleteApi.deleteUpload).toHaveBeenCalledWith("upl_other")
    expect(localStorage.getItem(STORAGE_SELECTED_PERSON_KEY)).toBe("upl_keep_this")
  })

  it("handles 409 conflict error (UPLOAD_IN_USE) and preserves selection", async () => {
    localStorage.setItem(STORAGE_SELECTED_PERSON_KEY, "upl_in_use")
    vi.spyOn(deleteApi, "deleteUpload").mockRejectedValue(
      new AppApiError({
        code: "UPLOAD_IN_USE",
        message: "Cannot delete upload because active try-on jobs depend on it.",
        status: 409,
      })
    )

    const wrapper = createAllProvidersWrapper(["/app/uploads"])
    const { result } = renderHook(() => useDeleteUpload(), { wrapper })

    await act(async () => {
      try {
        await result.current.mutateAsync("upl_in_use")
      } catch {
        // Expected rejection
      }
    })

    expect(deleteApi.deleteUpload).toHaveBeenCalledWith("upl_in_use")
    // Invariant: Selection and item must remain preserved upon conflict
    expect(localStorage.getItem(STORAGE_SELECTED_PERSON_KEY)).toBe("upl_in_use")
  })
})
