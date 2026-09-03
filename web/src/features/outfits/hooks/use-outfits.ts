import { useQuery } from "@tanstack/react-query"
import { outfitKeys } from "../query-keys"
import { listOutfits, getOutfit } from "../api/outfits-api"
import type { Outfit, OutfitListParams, OutfitListResponse } from "../types"

export function useOutfits(params?: OutfitListParams) {
  return useQuery<OutfitListResponse>({
    queryKey: outfitKeys.list(params),
    queryFn: () => listOutfits(params),
  })
}

export function useOutfit(outfitId: string) {
  return useQuery<Outfit>({
    queryKey: outfitKeys.detail(outfitId),
    queryFn: () => getOutfit(outfitId),
    enabled: Boolean(outfitId),
  })
}
