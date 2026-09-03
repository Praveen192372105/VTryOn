import type { Outfit } from "../outfits/types"
import type { PaginationMeta } from "../../types/pagination"

export interface Favorite {
  id: string
  outfit_id: string
  created_at: string
  outfit?: Outfit
}

export interface FavoriteListResponse {
  items: Outfit[]
  meta: PaginationMeta
}
