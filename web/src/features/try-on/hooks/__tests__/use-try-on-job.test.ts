import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { useTryOnJob, getTryOnRefetchInterval } from "../use-try-on-job"
import * as getTryOnApi from "../../api/get-try-on"
import { createAllProvidersWrapper } from "../../../../test/render"
import type { TryOnJob } from "../../types"

vi.mock("../../api/get-try-on")

describe("useTryOnJob & getTryOnRefetchInterval", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getTryOnRefetchInterval policy", () => {
    const queuedJob: TryOnJob = {
      id: "job_1",
      person_upload_id: "upl_1",
      outfit_id: "out_1",
      status: "queued",
      created_at: new Date().toISOString(),
    }

    const processingJob: TryOnJob = {
      id: "job_2",
      person_upload_id: "upl_1",
      outfit_id: "out_1",
      status: "processing",
      created_at: new Date().toISOString(),
    }

    const succeededJob: TryOnJob = {
      id: "job_3",
      person_upload_id: "upl_1",
      outfit_id: "out_1",
      status: "succeeded",
      created_at: new Date().toISOString(),
    }

    const failedJob: TryOnJob = {
      id: "job_4",
      person_upload_id: "upl_1",
      outfit_id: "out_1",
      status: "failed",
      created_at: new Date().toISOString(),
    }

    it("returns false if the browser tab is hidden", () => {
      expect(getTryOnRefetchInterval(queuedJob, 5000, true)).toBe(false)
      expect(getTryOnRefetchInterval(processingJob, 10000, true)).toBe(false)
    })

    it("returns false immediately on terminal status (succeeded or failed)", () => {
      expect(getTryOnRefetchInterval(succeededJob, 2000, false)).toBe(false)
      expect(getTryOnRefetchInterval(failedJob, 2000, false)).toBe(false)
    })

    it("applies truthful adaptive backoff intervals based on elapsed time", () => {
      // 0 - 15 seconds elapsed -> 2,000ms
      expect(getTryOnRefetchInterval(queuedJob, 0, false)).toBe(2000)
      expect(getTryOnRefetchInterval(processingJob, 14999, false)).toBe(2000)

      // 15 - 45 seconds elapsed -> 3,000ms
      expect(getTryOnRefetchInterval(processingJob, 15000, false)).toBe(3000)
      expect(getTryOnRefetchInterval(processingJob, 44999, false)).toBe(3000)

      // 45 - 120 seconds elapsed -> 5,000ms
      expect(getTryOnRefetchInterval(processingJob, 45000, false)).toBe(5000)
      expect(getTryOnRefetchInterval(processingJob, 119999, false)).toBe(5000)

      // > 120 seconds elapsed -> 8,000ms
      expect(getTryOnRefetchInterval(processingJob, 120000, false)).toBe(8000)
      expect(getTryOnRefetchInterval(processingJob, 300000, false)).toBe(8000)
    })

    it("respects manual overrideInterval if explicitly passed", () => {
      expect(getTryOnRefetchInterval(processingJob, 1000, false, 100)).toBe(100)
    })
  })

  describe("hook integration", () => {
    it("polls while status is queued or processing, and stops when succeeded", async () => {
      let callIndex = 0
      const jobProgression: TryOnJob[] = [
        {
          id: "job_123",
          person_upload_id: "upl_1",
          outfit_id: "out_1",
          status: "queued",
          created_at: new Date().toISOString(),
        },
        {
          id: "job_123",
          person_upload_id: "upl_1",
          outfit_id: "out_1",
          status: "processing",
          created_at: new Date().toISOString(),
        },
        {
          id: "job_123",
          person_upload_id: "upl_1",
          outfit_id: "out_1",
          status: "succeeded",
          result: {
            id: "res_123",
            image_url: "/api/v1/try-ons/job_123/content",
            width: 768,
            height: 1024,
            created_at: new Date().toISOString(),
          },
          result_image_url: "/api/v1/try-ons/job_123/content",
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

      expect(result.current.data?.result?.image_url).toBe("/api/v1/try-ons/job_123/content")
      expect(callIndex).toBeGreaterThanOrEqual(3)
    })

    it("stops polling when status is failed", async () => {
      vi.spyOn(getTryOnApi, "getTryOn").mockResolvedValue({
        id: "job_456",
        person_upload_id: "upl_1",
        outfit_id: "out_1",
        status: "failed",
        error: {
          code: "INVALID_INPUT",
          message: "Pose estimation failed",
        },
        error_message: "Pose estimation failed",
        created_at: new Date().toISOString(),
      })

      const wrapper = createAllProvidersWrapper(["/"])
      const { result } = renderHook(() => useTryOnJob("job_456", { refetchIntervalMs: 50 }), { wrapper })

      await waitFor(() => {
        expect(result.current.data?.status).toBe("failed")
      })

      expect(result.current.data?.error?.code).toBe("INVALID_INPUT")
    })

    it("refetches active job when browser tab becomes visible", async () => {
      const activeJob: TryOnJob = {
        id: "job_active_789",
        person_upload_id: "upl_1",
        outfit_id: "out_1",
        status: "processing",
        created_at: new Date().toISOString(),
      }

      const getTryOnSpy = vi.spyOn(getTryOnApi, "getTryOn").mockResolvedValue(activeJob)

      const wrapper = createAllProvidersWrapper(["/"])
      const { result } = renderHook(() => useTryOnJob("job_active_789", { enabled: true }), { wrapper })

      await waitFor(() => {
        expect(result.current.data?.status).toBe("processing")
      })

      const initialCalls = getTryOnSpy.mock.calls.length

      // Simulate visibility change to visible
      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        writable: true,
      })

      act(() => {
        document.dispatchEvent(new Event("visibilitychange"))
      })

      await waitFor(() => {
        expect(getTryOnSpy.mock.calls.length).toBeGreaterThan(initialCalls)
      })
    })
  })
})
