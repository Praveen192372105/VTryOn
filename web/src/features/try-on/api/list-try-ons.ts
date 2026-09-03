import { apiClient, apiRequest } from "../../../lib/api/client"
import type { ApiSuccess } from "../../../lib/api/types"
import type { TryOnListResponse } from "../types"

export async function listTryOns(params?: { page?: number; page_size?: number }): Promise<TryOnListResponse> {
  return apiRequest<TryOnListResponse>(
    apiClient.get<ApiSuccess<TryOnListResponse>>("/try-ons", { params })
  )
}
