import { useQuery } from "@tanstack/react-query"
import { listTryOns } from "../api/list-try-ons"
import { tryOnKeys } from "../query-keys"
import type { TryOnListParams, TryOnListResponse } from "../types"

export const DEFAULT_TRY_ON_PAGE_SIZE = 12

export function useTryOnHistory(params?: TryOnListParams) {
  const normalizedParams: TryOnListParams = {
    page: params?.page || 1,
    page_size: params?.page_size || DEFAULT_TRY_ON_PAGE_SIZE,
    ...(params?.status ? { status: params.status } : {}),
  }

  return useQuery<TryOnListResponse>({
    queryKey: tryOnKeys.list(normalizedParams),
    queryFn: () => listTryOns(normalizedParams),
    placeholderData: (previousData) => previousData,
    staleTime: 15_000,
  })
}
