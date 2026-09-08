import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import {
  useCurrentOutfit,
  setSelectedOutfitId,
  clearSelectedOutfit,
} from "../use-current-outfit"
import { STORAGE_SELECTED_OUTFIT_KEY } from "../../constants"

// Mock useOutfit query so it doesn't try to make network calls in this hook test
vi.mock("../use-outfits", () => ({
  useOutfit: vi.fn().mockReturnValue({ data: null, isError: false }),
}))

describe("useCurrentOutfit", () => {
  beforeEach(() => {
    localStorage.clear()
    clearSelectedOutfit()
  })

  it("reads initial null state when storage is empty", () => {
    const { result } = renderHook(() => useCurrentOutfit())
    expect(result.current.selectedId).toBeNull()
  })

  it("persists selected outfit ID to storage and updates state", () => {
    const { result } = renderHook(() => useCurrentOutfit())

    act(() => {
      result.current.setSelectedId("out_test_123")
    })

    expect(result.current.selectedId).toBe("out_test_123")
    expect(localStorage.getItem(STORAGE_SELECTED_OUTFIT_KEY)).toBe("out_test_123")
  })

  it("clears selected outfit ID via helper function", () => {
    setSelectedOutfitId("out_test_999")
    expect(localStorage.getItem(STORAGE_SELECTED_OUTFIT_KEY)).toBe("out_test_999")

    act(() => {
      clearSelectedOutfit()
    })

    expect(localStorage.getItem(STORAGE_SELECTED_OUTFIT_KEY)).toBeNull()
  })

  it("synchronizes state across instances when global helper is called", () => {
    const { result } = renderHook(() => useCurrentOutfit())

    act(() => {
      setSelectedOutfitId("out_synced_456")
    })

    expect(result.current.selectedId).toBe("out_synced_456")
  })
})
