import type { PaginationMeta } from "../../types/pagination"

export type OutfitCategory = "tops" | "bottoms" | "one-pieces" | "outerwear" | "all"

export interface Outfit {
  id: string
  name: string
  description?: string
  category: string
  image_url: string
  brand?: string
  created_at?: string
  is_favorite?: boolean
}

export interface OutfitListParams {
  category?: string
  search?: string
  page?: number
  page_size?: number
}

export interface OutfitListResponse {
  items: Outfit[]
  meta: PaginationMeta
}
