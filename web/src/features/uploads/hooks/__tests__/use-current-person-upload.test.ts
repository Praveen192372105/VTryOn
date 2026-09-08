import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import {
  useCurrentPersonUpload,
  clearSelectedPersonUpload,
} from "../use-current-person-upload"
import * as listApi from "../../api/list-uploads"
import { createAllProvidersWrapper } from "../../../../test/render"
import { STORAGE_SELECTED_PERSON_KEY } from "../../constants"

vi.mock("../../api/list-uploads")

describe("useCurrentPersonUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("reads stored selection and updates localStorage upon setSelectedId", async () => {
    localStorage.setItem(STORAGE_SELECTED_PERSON_KEY, "upl_initial")
    vi.spyOn(listApi, "listUploads").mockResolvedValue({
      items: [
        {
          id: "upl_initial",
          mime_type: "image/jpeg",
          size_bytes: 1000,
          status: "active",
          image_url: "/media/photo.jpg",
          created_at: new Date().toISOString(),
        },
      ],
      pagination: { page: 1, page_size: 10, total: 1, total_pages: 1 },
    })

    const wrapper = createAllProvidersWrapper(["/"])
    const { result } = renderHook(() => useCurrentPersonUpload(), { wrapper })

    expect(result.current.selectedId).toBe("upl_initial")

    act(() => {
      result.current.setSelectedId("upl_updated")
    })

    expect(result.current.selectedId).toBe("upl_updated")
    expect(localStorage.getItem(STORAGE_SELECTED_PERSON_KEY)).toBe("upl_updated")
  })

  it("automatically purges stale selection if stored ID does not exist in user uploads", async () => {
    localStorage.setItem(STORAGE_SELECTED_PERSON_KEY, "upl_deleted_or_foreign")
    vi.spyOn(listApi, "listUploads").mockResolvedValue({
      items: [
        {
          id: "upl_existing_1",
          mime_type: "image/jpeg",
          size_bytes: 1000,
          status: "active",
          image_url: "/media/photo1.jpg",
          created_at: new Date().toISOString(),
        },
      ],
      pagination: { page: 1, page_size: 10, total: 1, total_pages: 1 },
    })

    const wrapper = createAllProvidersWrapper(["/"])
    const { result } = renderHook(() => useCurrentPersonUpload(), { wrapper })

    await waitFor(() => {
      // Invariant: Stale persisted ID must be automatically cleared
      expect(result.current.selectedId).toBeNull()
      expect(localStorage.getItem(STORAGE_SELECTED_PERSON_KEY)).toBeNull()
    })
  })

  it("clears selection when clearSelectedPersonUpload helper is invoked", () => {
    localStorage.setItem(STORAGE_SELECTED_PERSON_KEY, "upl_active")
    clearSelectedPersonUpload()
    expect(localStorage.getItem(STORAGE_SELECTED_PERSON_KEY)).toBeNull()
  })
})
