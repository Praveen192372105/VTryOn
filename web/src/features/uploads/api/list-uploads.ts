import { apiClient, apiRequest } from "@/lib/api/client"
import { uploadEndpoints } from "./endpoints"
import type { ApiSuccess } from "@/lib/api/types"
import type { UploadListResponse } from "../types"

export interface ListUploadsParams {
  page?: number
  page_size?: number
}

export async function listUploads(params?: ListUploadsParams): Promise<UploadListResponse> {
  const result = await apiRequest<UploadListResponse>(
    apiClient.get<ApiSuccess<UploadListResponse>>(uploadEndpoints.list, { params })
  )

  // Ensure items is always an array and provide meta fallback for backward compatibility
  const items = result?.items || []
  const pagination = result?.pagination || {
    page: params?.page || 1,
    page_size: params?.page_size || items.length,
    total: items.length,
    total_pages: 1,
  }

  return {
    items,
    pagination,
    meta: result?.meta || pagination,
  }
}
