export const outfitEndpoints = {
  list: "/outfits",
  custom: "/outfits/custom",
  detail: (outfitId: string) => `/outfits/${encodeURIComponent(outfitId)}`,
} as const
