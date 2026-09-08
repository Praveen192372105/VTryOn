import { apiClient, apiRequest } from "@/lib/api/client"
import { favoriteEndpoints } from "./endpoints"

/**
 * Remove outfit from favorites.
 * Canonical backend endpoint: DELETE /api/v1/outfits/{outfit_id}/favorite (204 No Content)
 */
export async function removeFavorite(outfitId: string): Promise<void> {
  await apiRequest<void>(apiClient.delete(favoriteEndpoints.unfavoriteOutfit(outfitId)))
}
