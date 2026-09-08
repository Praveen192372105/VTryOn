import { apiClient, apiRequest } from "@/lib/api/client"
import { outfitEndpoints } from "./endpoints"
import type { ApiSuccess } from "@/lib/api/types"
import type { OutfitListParams, OutfitListResponse } from "../types"

export async function listOutfits(params?: OutfitListParams): Promise<OutfitListResponse> {
  return apiRequest<OutfitListResponse>(
    apiClient.get<ApiSuccess<OutfitListResponse>>(outfitEndpoints.list, { params })
  )
}
