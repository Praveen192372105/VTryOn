import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { favoriteKeys } from "../query-keys"
import { listFavorites } from "../api"
import type { FavoriteListResponse } from "../types"

export function useFavorites(params?: { page?: number; page_size?: number }) {
  return useQuery<FavoriteListResponse>({
    queryKey: favoriteKeys.list(params),
    queryFn: () => listFavorites(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export { useToggleFavorite } from "./use-toggle-favorite"
