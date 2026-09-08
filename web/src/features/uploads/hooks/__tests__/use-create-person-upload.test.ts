import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { useCreatePersonUpload } from "../use-create-person-upload"
import * as createApi from "../../api/create-person-upload"
import { createAllProvidersWrapper } from "../../../../test/render"
import { STORAGE_SELECTED_PERSON_KEY } from "../../constants"

vi.mock("../../api/create-person-upload")

describe("useCreatePersonUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("submits file via createPersonUpload and automatically selects new upload on success", async () => {
    const mockUpload = {
      id: "upl_12345",
      original_filename: "portrait.jpg",
      mime_type: "image/jpeg",
      size_bytes: 102400,
      width: 800,
      height: 1200,
      status: "active",
      image_url: "/media/people/usr_1/upl_12345.jpg",
      created_at: new Date().toISOString(),
    }

    vi.spyOn(createApi, "createPersonUpload").mockResolvedValue(mockUpload)

    const wrapper = createAllProvidersWrapper(["/app/uploads"])
    const { result } = renderHook(() => useCreatePersonUpload(), { wrapper })

    const file = new File(["test-content"], "portrait.jpg", { type: "image/jpeg" })

    await act(async () => {
      await result.current.mutateAsync(file)
    })

    expect(createApi.createPersonUpload).toHaveBeenCalledTimes(1)
    expect(createApi.createPersonUpload).toHaveBeenCalledWith(file)

    // Invariant: Newly uploaded image is automatically marked as current selection
    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_SELECTED_PERSON_KEY)).toBe("upl_12345")
    })
  })
})
