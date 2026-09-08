import { apiClient, apiRequest } from "@/lib/api/client"
import { outfitEndpoints } from "./endpoints"
import type { ApiSuccess } from "@/lib/api/types"
import type { OutfitResponse } from "../types"

export async function getOutfit(outfitId: string): Promise<OutfitResponse> {
  return apiRequest<OutfitResponse>(
    apiClient.get<ApiSuccess<OutfitResponse>>(outfitEndpoints.detail(outfitId))
  )
}
