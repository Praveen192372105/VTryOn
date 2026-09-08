export type OutfitCategory = "upper_body" | "lower_body" | "dresses"

export interface OutfitPaginationMetadata {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface OutfitListItem {
  id: string
  name: string
  slug: string
  category: OutfitCategory
  image_url: string
  thumbnail_url?: string | null
  is_favorite: boolean
  is_favorited?: boolean
  created_at: string
}

export interface OutfitResponse {
  id: string
  name: string
  slug: string
  category: OutfitCategory
  description?: string | null
  image_url: string
  thumbnail_url?: string | null
  is_active: boolean
  is_favorite: boolean
  is_favorited?: boolean
  created_at: string
  updated_at?: string | null
}

// Backward-compatibility alias
export type Outfit = OutfitListItem

export interface OutfitListParams {
  category?: OutfitCategory
  search?: string
  page?: number
  page_size?: number
}

export interface OutfitListResponse {
  items: OutfitListItem[]
  pagination: OutfitPaginationMetadata
  // Backward compatibility alias for older meta shape
  meta?: OutfitPaginationMetadata
}
