import { apiClient, apiRequest } from "@/lib/api/client"
import { favoriteEndpoints } from "./endpoints"
import type { ApiSuccess } from "@/lib/api/types"
import type { FavoriteListResponse } from "../types"

export async function listFavorites(params?: { page?: number; page_size?: number }): Promise<FavoriteListResponse> {
  return apiRequest<FavoriteListResponse>(
    apiClient.get<ApiSuccess<FavoriteListResponse>>(favoriteEndpoints.list, { params })
  )
}
