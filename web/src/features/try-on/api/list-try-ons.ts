import { apiClient, apiRequest } from "../../../lib/api/client"
import { tryOnEndpoints } from "./endpoints"
import type { ApiSuccess } from "../../../lib/api/types"
import type { TryOnListParams, TryOnListResponse } from "../types"

export async function listTryOns(params?: TryOnListParams): Promise<TryOnListResponse> {
  return apiRequest<TryOnListResponse>(
    apiClient.get<ApiSuccess<TryOnListResponse>>(tryOnEndpoints.list, { params })
  )
}
