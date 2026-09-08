import { useQuery } from "@tanstack/react-query"
import { authKeys } from "../query-keys"
import { getCurrentUser } from "../api/get-current-user"
import { tokenStore } from "@/lib/auth/token-store"
import type { User } from "@/lib/api/types"

export function useCurrentUser() {
  const hasToken = tokenStore.hasValidSession()

  return useQuery<User>({
    queryKey: authKeys.me(),
    queryFn: getCurrentUser,
    enabled: hasToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
