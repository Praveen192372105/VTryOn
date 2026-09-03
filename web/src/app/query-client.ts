import { QueryClient } from "@tanstack/react-query"
import { AppApiError } from "../lib/api/errors"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false

        if (error instanceof AppApiError) {
          // Never retry client-side or validation errors
          if (
            error.status &&
            [400, 401, 403, 404, 409, 413, 415, 422, 429].includes(error.status)
          ) {
            return false
          }
        }
        return true
      },
    },
    mutations: {
      // Mutations must not auto-retry by default to prevent duplicate jobs
      retry: false,
    },
  },
})
