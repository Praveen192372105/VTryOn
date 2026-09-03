import type { OutfitListParams } from "./types"

export const outfitKeys = {
  all: ["outfits"] as const,
  lists: () => [...outfitKeys.all, "list"] as const,
  list: (params?: OutfitListParams) => [...outfitKeys.lists(), params] as const,
  details: () => [...outfitKeys.all, "detail"] as const,
  detail: (id: string) => [...outfitKeys.details(), id] as const,
}
