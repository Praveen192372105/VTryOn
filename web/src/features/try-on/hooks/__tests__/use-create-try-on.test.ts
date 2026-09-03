import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useCreateTryOn } from "../use-create-try-on"
import * as createTryOnApi from "../../api/create-try-on"
import { createAllProvidersWrapper } from "../../../../test/render"
import type { TryOnJob } from "../../types"

vi.mock("../../api/create-try-on")

describe("useCreateTryOn hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calls createTryOn API once and returns the created job", async () => {
    const mockCreatedJob: TryOnJob = {
      id: "job_created_999",
      user_id: "usr_1",
      person_upload_id: "upl_1",
      outfit_id: "out_1",
      status: "queued",
      created_at: new Date().toISOString(),
    }

    const createSpy = vi.spyOn(createTryOnApi, "createTryOn").mockResolvedValue(mockCreatedJob)

    const wrapper = createAllProvidersWrapper(["/"])
    const { result } = renderHook(() => useCreateTryOn(), { wrapper })

    let mutationResult: TryOnJob | undefined

    await act(async () => {
      mutationResult = await result.current.mutateAsync({
        person_upload_id: "upl_1",
        outfit_id: "out_1",
      })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(createSpy).toHaveBeenCalledWith({
      person_upload_id: "upl_1",
      outfit_id: "out_1",
    })
    expect(mutationResult?.id).toBe("job_created_999")
  })
})
