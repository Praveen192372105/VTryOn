import { apiClient, apiRequest } from "../../../lib/api/client"
import type { ApiSuccess } from "../../../lib/api/types"
import type { Outfit, OutfitListParams, OutfitListResponse } from "../types"

export async function listOutfits(params?: OutfitListParams): Promise<OutfitListResponse> {
  return apiRequest<OutfitListResponse>(
    apiClient.get<ApiSuccess<OutfitListResponse>>("/outfits", { params })
  )
}

export async function getOutfit(outfitId: string): Promise<Outfit> {
  return apiRequest<Outfit>(
    apiClient.get<ApiSuccess<Outfit>>(`/outfits/${outfitId}`)
  )
}
