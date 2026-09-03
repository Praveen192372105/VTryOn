import { apiClient, apiRequest } from "../../../lib/api/client"
import type { ApiSuccess } from "../../../lib/api/types"
import type { FavoriteListResponse } from "../types"

export async function listFavorites(params?: { page?: number; page_size?: number }): Promise<FavoriteListResponse> {
  return apiRequest<FavoriteListResponse>(
    apiClient.get<ApiSuccess<FavoriteListResponse>>("/favorites", { params })
  )
}

export async function addFavorite(outfitId: string): Promise<void> {
  await apiRequest<void>(
    apiClient.post<ApiSuccess<void>>(`/favorites/${outfitId}`)
  )
}

export async function removeFavorite(outfitId: string): Promise<void> {
  await apiRequest<void>(
    apiClient.delete<ApiSuccess<void>>(`/favorites/${outfitId}`)
  )
}
