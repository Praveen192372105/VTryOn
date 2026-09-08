import type { OutfitListItem, OutfitPaginationMetadata } from "../outfits/types"

export interface FavoriteItemResponse {
  outfit: OutfitListItem
  favorited_at: string
}

export interface FavoriteListResponse {
  items: FavoriteItemResponse[]
  pagination: OutfitPaginationMetadata
}

// Backward compatibility alias
export interface Favorite {
  id: string
  outfit_id: string
  created_at: string
  outfit?: OutfitListItem
}
