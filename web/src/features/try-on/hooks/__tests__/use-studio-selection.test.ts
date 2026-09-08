import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useStudioSelection } from "../use-studio-selection"
import { createAllProvidersWrapper } from "../../../../test/render"
import * as listUploadsApi from "../../../uploads/api/list-uploads"
import * as getOutfitApi from "../../../outfits/api/get-outfit"

vi.mock("../../../uploads/api/list-uploads")
vi.mock("../../../outfits/api/get-outfit")

describe("useStudioSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(listUploadsApi, "listUploads").mockResolvedValue({
      items: [
        {
          id: "upl_valid_1",
          mime_type: "image/jpeg",
          size_bytes: 1200,
          status: "active",
          image_url: "/media/photo1.jpg",
          created_at: new Date().toISOString(),
        },
      ],
      pagination: { page: 1, page_size: 10, total: 1, total_pages: 1 },
    })
    vi.spyOn(getOutfitApi, "getOutfit").mockResolvedValue({
      id: "out_valid_1",
      name: "Tailored Linen Suit",
      slug: "tailored-linen-suit",
      category: "upper_body",
      image_url: "/media/suit.jpg",
      is_favorite: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  })

  it("reads person and outfit parameters from initial URL", () => {
    const wrapper = createAllProvidersWrapper(["/app/studio?person=upl_valid_1&outfit=out_valid_1"])
    const { result } = renderHook(() => useStudioSelection(), { wrapper })

    expect(result.current.personUploadId).toBe("upl_valid_1")
    expect(result.current.outfitId).toBe("out_valid_1")
  })

  it("updates person parameter while preserving outfit parameter", () => {
    const wrapper = createAllProvidersWrapper(["/app/studio?person=upl_valid_1&outfit=out_valid_1"])
    const { result } = renderHook(() => useStudioSelection(), { wrapper })

    act(() => {
      result.current.setPersonUploadId("upl_new_2")
    })

    expect(result.current.personUploadId).toBe("upl_new_2")
    expect(result.current.outfitId).toBe("out_valid_1")
  })

  it("updates outfit parameter while preserving person parameter", () => {
    const wrapper = createAllProvidersWrapper(["/app/studio?person=upl_valid_1&outfit=out_valid_1"])
    const { result } = renderHook(() => useStudioSelection(), { wrapper })

    act(() => {
      result.current.setOutfitId("out_new_2")
    })

    expect(result.current.personUploadId).toBe("upl_valid_1")
    expect(result.current.outfitId).toBe("out_new_2")
  })

  it("clears person parameter while preserving outfit parameter", () => {
    const wrapper = createAllProvidersWrapper(["/app/studio?person=upl_valid_1&outfit=out_valid_1"])
    const { result } = renderHook(() => useStudioSelection(), { wrapper })

    act(() => {
      result.current.clearPersonUpload()
    })

    expect(result.current.personUploadId).toBeNull()
    expect(result.current.outfitId).toBe("out_valid_1")
  })

  it("clears outfit parameter while preserving person parameter", () => {
    const wrapper = createAllProvidersWrapper(["/app/studio?person=upl_valid_1&outfit=out_valid_1"])
    const { result } = renderHook(() => useStudioSelection(), { wrapper })

    act(() => {
      result.current.clearOutfit()
    })

    expect(result.current.personUploadId).toBe("upl_valid_1")
    expect(result.current.outfitId).toBeNull()
  })

  it("clears all parameters cleanly", () => {
    const wrapper = createAllProvidersWrapper(["/app/studio?person=upl_valid_1&outfit=out_valid_1"])
    const { result } = renderHook(() => useStudioSelection(), { wrapper })

    act(() => {
      result.current.clearAll()
    })

    expect(result.current.personUploadId).toBeNull()
    expect(result.current.outfitId).toBeNull()
  })

  it("automatically purges invalid person parameter if ID does not exist in user uploads", async () => {
    const wrapper = createAllProvidersWrapper(["/app/studio?person=upl_foreign_999&outfit=out_valid_1"])
    const { result } = renderHook(() => useStudioSelection(), { wrapper })

    await waitFor(() => {
      expect(result.current.personUploadId).toBeNull()
      expect(result.current.outfitId).toBe("out_valid_1")
    })
  })

  it("automatically purges invalid outfit parameter if outfit endpoint returns 404", async () => {
    vi.spyOn(getOutfitApi, "getOutfit").mockRejectedValue(new Error("404 Outfit not found"))

    const wrapper = createAllProvidersWrapper(["/app/studio?person=upl_valid_1&outfit=out_deleted_999"])
    const { result } = renderHook(() => useStudioSelection(), { wrapper })

    await waitFor(() => {
      expect(result.current.outfitId).toBeNull()
      expect(result.current.personUploadId).toBe("upl_valid_1")
    })
  })
})
