import { QueryClient } from "@tanstack/react-query"
import { AppApiError } from "../lib/api/errors"
import { authKeys } from "../features/auth/query-keys"
import { uploadKeys } from "../features/uploads/query-keys"
import { outfitKeys } from "../features/outfits/query-keys"
import { favoriteKeys } from "../features/favorites/query-keys"
import { tryOnKeys } from "../features/try-on/query-keys"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false

        if (error instanceof AppApiError) {
          // Never retry obvious client or authorization errors
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
      // Mutations must not auto-retry by default to prevent duplicate jobs or uploads
      retry: false,
    },
  },
})

/**
 * Cancels all active in-flight requests and removes all user-scoped/private queries
 * from the TanStack Query cache. Invoked on logout, session expiration, or account switch.
 */
export async function clearPrivateQueryState(client: QueryClient): Promise<void> {
  try {
    await client.cancelQueries()
  } catch {
    // Suppress query cancellation errors during teardown
  }

  client.removeQueries({ queryKey: authKeys.all })
  client.removeQueries({ queryKey: uploadKeys.all })
  client.removeQueries({ queryKey: outfitKeys.all })
  client.removeQueries({ queryKey: favoriteKeys.all })
  client.removeQueries({ queryKey: tryOnKeys.all })
  client.clear()
}
