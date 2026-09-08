import { apiClient, apiRequest } from "@/lib/api/client"
import { favoriteEndpoints } from "./endpoints"

/**
 * Add outfit to favorites.
 * Canonical backend endpoint: PUT /api/v1/outfits/{outfit_id}/favorite (204 No Content)
 */
export async function addFavorite(outfitId: string): Promise<void> {
  await apiRequest<void>(apiClient.put(favoriteEndpoints.favoriteOutfit(outfitId)))
}
