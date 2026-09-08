import type { OutfitListItem, OutfitResponse, OutfitListResponse } from "../../features/outfits/types"

export const mockOutfitSilkShirt: OutfitListItem = {
  id: "out_fixture_1",
  name: "Silk Oxford Shirt",
  slug: "silk-oxford-shirt",
  category: "upper_body",
  image_url: "/media/outfits/silk_shirt.jpg",
  is_favorite: false,
  created_at: "2026-09-01T12:00:00.000Z",
}

export const mockOutfitLinenPants: OutfitListItem = {
  id: "out_fixture_2",
  name: "Tailored Linen Trousers",
  slug: "tailored-linen-trousers",
  category: "lower_body",
  image_url: "/media/outfits/linen_pants.jpg",
  is_favorite: true,
  created_at: "2026-09-01T12:00:00.000Z",
}

export const mockOutfitDetailSilkShirt: OutfitResponse = {
  ...mockOutfitSilkShirt,
  is_active: true,
  description: "Crafted from mulberry silk with relaxed drape, ideal for smart-casual virtual fittings.",
}

export const mockOutfitListResponse: OutfitListResponse = {
  items: [mockOutfitSilkShirt, mockOutfitLinenPants],
  pagination: {
    page: 1,
    page_size: 20,
    total: 2,
    total_pages: 1,
  },
}
