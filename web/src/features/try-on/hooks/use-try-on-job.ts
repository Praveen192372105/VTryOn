import { useQuery } from "@tanstack/react-query"
import { getTryOn } from "../api/get-try-on"
import { tryOnKeys } from "../query-keys"
import { APP_CONFIG } from "../../../config/app-config"
import type { TryOnJob } from "../types"

interface UseTryOnJobOptions {
  enabled?: boolean
  refetchIntervalMs?: number
}

export function useTryOnJob(jobId: string, options: UseTryOnJobOptions = {}) {
  const { enabled = true, refetchIntervalMs = APP_CONFIG.polling.tryOnIntervalMs } = options

  return useQuery<TryOnJob>({
    queryKey: tryOnKeys.detail(jobId),
    queryFn: () => getTryOn(jobId),
    enabled: Boolean(jobId) && enabled,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) {
        return refetchIntervalMs
      }

      // Terminal states: stop polling immediately
      if (data.status === "succeeded" || data.status === "failed") {
        return false
      }

      // Active states (queued, processing): continue polling
      return refetchIntervalMs
    },
    refetchIntervalInBackground: false,
  })
}
