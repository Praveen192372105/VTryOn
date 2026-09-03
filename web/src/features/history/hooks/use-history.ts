import { useQuery } from "@tanstack/react-query"
import { listTryOns, tryOnKeys } from "../../try-on"
import type { TryOnListResponse } from "../../try-on"

export function useHistory(params?: { page?: number; page_size?: number }) {
  return useQuery<TryOnListResponse>({
    queryKey: tryOnKeys.list(params),
    queryFn: () => listTryOns(params),
  })
}
