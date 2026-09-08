export const favoriteEndpoints = {
  list: "/favorites",
  favoriteOutfit: (outfitId: string) => `/outfits/${encodeURIComponent(outfitId)}/favorite`,
  unfavoriteOutfit: (outfitId: string) => `/outfits/${encodeURIComponent(outfitId)}/favorite`,
} as const
