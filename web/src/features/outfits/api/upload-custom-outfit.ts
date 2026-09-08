import { apiClient, apiRequest } from "@/lib/api/client"
import { outfitEndpoints } from "./endpoints"
import type { ApiSuccess } from "@/lib/api/types"
import type { Outfit } from "../types"

export interface UploadCustomOutfitParams {
  file: File
  name?: string
  category?: string
}

/**
 * Uploads an owned custom garment via multipart/form-data.
 */
export async function uploadCustomOutfit({ file, name, category }: UploadCustomOutfitParams): Promise<Outfit> {
  const formData = new FormData()
  formData.append("file", file)
  if (name) formData.append("name", name)
  if (category) formData.append("category", category)

  return apiRequest<Outfit>(
    apiClient.post<ApiSuccess<Outfit>>(outfitEndpoints.custom, formData, {
      headers: {
        "Content-Type": undefined,
      },
    })
  )
}
