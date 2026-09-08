import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { outfitKeys } from "../query-keys"
import { listOutfits, getOutfit } from "../api"
import type { OutfitListParams, OutfitListResponse, OutfitResponse } from "../types"

export function useOutfits(params?: OutfitListParams) {
  return useQuery<OutfitListResponse>({
    queryKey: outfitKeys.list(params),
    queryFn: () => listOutfits(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useOutfit(outfitId: string) {
  return useQuery<OutfitResponse>({
    queryKey: outfitKeys.detail(outfitId),
    queryFn: () => getOutfit(outfitId),
    enabled: Boolean(outfitId && outfitId.trim().length > 0),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
