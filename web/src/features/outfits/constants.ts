import type { OutfitCategory } from "./types"

export const OUTFIT_CATEGORIES: OutfitCategory[] = [
  "upper_body",
  "lower_body",
  "dresses",
]

export const OUTFIT_CATEGORY_LABELS: Record<OutfitCategory, string> = {
  upper_body: "Tops",
  lower_body: "Bottoms",
  dresses: "Dresses",
}

export const DEFAULT_OUTFIT_PAGE_SIZE = 24

export const STORAGE_SELECTED_OUTFIT_KEY = "vtryon_selected_outfit_id"
export const EVENT_SELECTED_OUTFIT_CHANGED = "vtryon:selected_outfit_changed"
