import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { addFavorite, removeFavorite } from "../api"
import { favoriteKeys } from "../query-keys"
import { outfitKeys } from "../../outfits/query-keys"
import type { FavoriteListResponse, FavoriteItemResponse } from "../types"
import type { OutfitListItem, OutfitListResponse, OutfitResponse } from "../../outfits/types"

export interface ToggleFavoriteVariables {
  outfitId: string
  currentIsFavorite: boolean
  outfit?: OutfitListItem
}

interface MutationContext {
  previousOutfitLists: [readonly unknown[], OutfitListResponse | undefined][]
  previousOutfitDetails: [readonly unknown[], OutfitResponse | undefined][]
  previousFavoriteLists: [readonly unknown[], FavoriteListResponse | undefined][]
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, ToggleFavoriteVariables, MutationContext>({
    mutationFn: async ({ outfitId, currentIsFavorite }) => {
      if (currentIsFavorite) {
        await removeFavorite(outfitId)
      } else {
        await addFavorite(outfitId)
      }
    },
    retry: false,
    onMutate: async ({ outfitId, currentIsFavorite, outfit }) => {
      // 1. Cancel ongoing queries that might overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: outfitKeys.all })
      await queryClient.cancelQueries({ queryKey: favoriteKeys.all })

      // 2. Snapshot current caches for rollback
      const previousOutfitLists = queryClient.getQueriesData<OutfitListResponse>({
        queryKey: outfitKeys.lists(),
      })
      const previousOutfitDetails = queryClient.getQueriesData<OutfitResponse>({
        queryKey: outfitKeys.details(),
      })
      const previousFavoriteLists = queryClient.getQueriesData<FavoriteListResponse>({
        queryKey: favoriteKeys.lists(),
      })

      const newIsFavorite = !currentIsFavorite

      // 3. Optimistically update all cached outfit catalogue lists
      queryClient.setQueriesData<OutfitListResponse>(
        { queryKey: outfitKeys.lists() },
        (old) => {
          if (!old?.items) return old
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === outfitId
                ? { ...item, is_favorite: newIsFavorite, is_favorited: newIsFavorite }
                : item
            ),
          }
        }
      )

      // 4. Optimistically update cached outfit detail if active
      queryClient.setQueryData<OutfitResponse>(
        outfitKeys.detail(outfitId),
        (old) => {
          if (!old) return old
          return {
            ...old,
            is_favorite: newIsFavorite,
            is_favorited: newIsFavorite,
          }
        }
      )

      // 5. Optimistically update cached favorites lists
      queryClient.setQueriesData<FavoriteListResponse>(
        { queryKey: favoriteKeys.lists() },
        (old) => {
          if (!old?.items) return old
          if (currentIsFavorite) {
            // Unfavorited: optimistically remove from favorites list
            return {
              ...old,
              items: old.items.filter((fav) => fav.outfit.id !== outfitId),
              pagination: {
                ...old.pagination,
                total: Math.max(0, old.pagination.total - 1),
              },
            }
          } else if (outfit) {
            // Favorited: optimistically prepend to favorites list
            const newFavoriteItem: FavoriteItemResponse = {
              outfit: {
                ...outfit,
                is_favorite: true,
                is_favorited: true,
              },
              favorited_at: new Date().toISOString(),
            }
            return {
              ...old,
              items: [newFavoriteItem, ...old.items],
              pagination: {
                ...old.pagination,
                total: old.pagination.total + 1,
              },
            }
          }
          return old
        }
      )

      return {
        previousOutfitLists,
        previousOutfitDetails,
        previousFavoriteLists,
      }
    },
    onError: (_err, _vars, context) => {
      // Rollback all caches to snapshot states
      if (context) {
        for (const [key, data] of context.previousOutfitLists) {
          queryClient.setQueryData(key, data)
        }
        for (const [key, data] of context.previousOutfitDetails) {
          queryClient.setQueryData(key, data)
        }
        for (const [key, data] of context.previousFavoriteLists) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Couldn't update favorites. Try again.")
    },
    onSettled: (_data, _err, { outfitId }) => {
      // Reconcile server truth across all affected queries
      queryClient.invalidateQueries({ queryKey: outfitKeys.lists() })
      queryClient.invalidateQueries({ queryKey: outfitKeys.detail(outfitId) })
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all })
    },
  })
}
