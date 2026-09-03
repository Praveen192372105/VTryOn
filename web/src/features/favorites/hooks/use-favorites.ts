import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { favoriteKeys } from "../query-keys"
import { listFavorites, addFavorite, removeFavorite } from "../api/favorites-api"
import { outfitKeys } from "../../outfits"
import type { FavoriteListResponse } from "../types"

export function useFavorites(params?: { page?: number; page_size?: number }) {
  return useQuery<FavoriteListResponse>({
    queryKey: favoriteKeys.list(params),
    queryFn: () => listFavorites(params),
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ outfitId, isFavorite }: { outfitId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await removeFavorite(outfitId)
      } else {
        await addFavorite(outfitId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: outfitKeys.lists() })
    },
  })
}
