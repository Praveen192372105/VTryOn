import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useTryOnJob } from "../use-try-on-job"
import * as getTryOnApi from "../../api/get-try-on"
import { createAllProvidersWrapper } from "../../../../test/render"
import type { TryOnJob } from "../../types"

vi.mock("../../api/get-try-on")

describe("useTryOnJob hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("polls while status is queued or processing, and stops when succeeded", async () => {
    let callIndex = 0
    const jobProgression: TryOnJob[] = [
      {
        id: "job_123",
        user_id: "usr_1",
        person_upload_id: "upl_1",
        outfit_id: "out_1",
        status: "queued",
        created_at: new Date().toISOString(),
      },
      {
        id: "job_123",
        user_id: "usr_1",
        person_upload_id: "upl_1",
        outfit_id: "out_1",
        status: "processing",
        created_at: new Date().toISOString(),
      },
      {
        id: "job_123",
        user_id: "usr_1",
        person_upload_id: "upl_1",
        outfit_id: "out_1",
        status: "succeeded",
        result_image_url: "https://example.com/result.jpg",
        created_at: new Date().toISOString(),
      },
    ]

    vi.spyOn(getTryOnApi, "getTryOn").mockImplementation(async () => {
      const current = jobProgression[Math.min(callIndex, jobProgression.length - 1)]
      callIndex++
      return current
    })

    const wrapper = createAllProvidersWrapper(["/"])
    const { result } = renderHook(() => useTryOnJob("job_123", { refetchIntervalMs: 50 }), { wrapper })

    await waitFor(() => {
      expect(result.current.data?.status).toBe("succeeded")
    })

    expect(result.current.data?.result_image_url).toBe("https://example.com/result.jpg")
    expect(callIndex).toBeGreaterThanOrEqual(3)
  })

  it("stops polling when status is failed", async () => {
    vi.spyOn(getTryOnApi, "getTryOn").mockResolvedValue({
      id: "job_456",
      user_id: "usr_1",
      person_upload_id: "upl_1",
      outfit_id: "out_1",
      status: "failed",
      error_message: "Anatomical mask error",
      created_at: new Date().toISOString(),
    })

    const wrapper = createAllProvidersWrapper(["/"])
    const { result } = renderHook(() => useTryOnJob("job_456", { refetchIntervalMs: 50 }), { wrapper })

    await waitFor(() => {
      expect(result.current.data?.status).toBe("failed")
    })

    expect(result.current.data?.error_message).toBe("Anatomical mask error")
  })
})
