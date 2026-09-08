import { useEffect, useRef, useState, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getTryOn } from "../api/get-try-on"
import { tryOnKeys } from "../query-keys"
import type { TryOnJob, TryOnStatus } from "../types"

export interface UseTryOnJobOptions {
  enabled?: boolean
  refetchIntervalMs?: number // Manual override for testing or fixed interval
}

/**
 * Adaptive polling policy for asynchronous Try-On jobs:
 * - Tab hidden: paused (returns false)
 * - Terminal statuses (succeeded, failed): stops immediately (returns false)
 * - 0 - 15s elapsed: 2,000ms
 * - 15s - 45s elapsed: 3,000ms
 * - 45s - 120s elapsed: 5,000ms
 * - > 120s elapsed: 8,000ms
 */
export function getTryOnRefetchInterval(
  job: TryOnJob | undefined,
  elapsedMs: number,
  isTabHidden = false,
  overrideInterval?: number
): number | false {
  if (isTabHidden) {
    return false
  }

  if (job?.status === "succeeded" || job?.status === "failed") {
    return false
  }

  if (overrideInterval !== undefined) {
    return overrideInterval
  }

  if (elapsedMs < 15_000) {
    return 2_000
  }
  if (elapsedMs < 45_000) {
    return 3_000
  }
  if (elapsedMs < 120_000) {
    return 5_000
  }
  return 8_000
}

export function useTryOnJob(jobId: string, options: UseTryOnJobOptions = {}) {
  const { enabled = true, refetchIntervalMs } = options
  const queryClient = useQueryClient()

  // Track start time for adaptive polling backoff, reset on jobId change
  const startTimeRef = useRef<number>(Date.now())
  const prevJobIdRef = useRef<string>(jobId)
  const prevStatusRef = useRef<TryOnStatus | undefined>(undefined)

  const [isTabHidden, setIsTabHidden] = useState<boolean>(() => {
    if (typeof document !== "undefined") {
      return document.visibilityState === "hidden"
    }
    return false
  })

  useEffect(() => {
    if (prevJobIdRef.current !== jobId) {
      prevJobIdRef.current = jobId
      startTimeRef.current = Date.now()
      prevStatusRef.current = undefined
    }
  }, [jobId])

  const query = useQuery<TryOnJob>({
    queryKey: tryOnKeys.detail(jobId),
    queryFn: () => getTryOn(jobId),
    enabled: Boolean(jobId) && enabled,
    refetchInterval: (queryState) => {
      const data = queryState.state.data
      const elapsed = Date.now() - startTimeRef.current
      return getTryOnRefetchInterval(data, elapsed, isTabHidden, refetchIntervalMs)
    },
    refetchIntervalInBackground: false,
  })

  const { data, refetch } = query

  // Tab visibility management: pause when hidden, immediate refetch when returning to visible
  const handleVisibilityChange = useCallback(() => {
    if (typeof document === "undefined") return
    const hidden = document.visibilityState === "hidden"
    setIsTabHidden(hidden)

    if (!hidden && data && (data.status === "queued" || data.status === "processing")) {
      refetch()
    }
  }, [data, refetch])

  useEffect(() => {
    if (typeof document === "undefined") return

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [handleVisibilityChange])

  // Invalidate history list when job reaches terminal status (succeeded or failed)
  useEffect(() => {
    if (!data?.status) return

    const currentStatus = data.status
    const prevStatus = prevStatusRef.current

    if (
      (prevStatus === "queued" || prevStatus === "processing") &&
      (currentStatus === "succeeded" || currentStatus === "failed")
    ) {
      queryClient.invalidateQueries({ queryKey: tryOnKeys.lists() })
    }

    prevStatusRef.current = currentStatus
  }, [data?.status, queryClient])

  return query
}
