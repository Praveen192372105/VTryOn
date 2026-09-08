import { apiClient, apiRequest } from "../../../lib/api/client"
import { tryOnEndpoints } from "./endpoints"
import type { ApiSuccess } from "../../../lib/api/types"
import type { TryOnJob, CreateTryOnRequest } from "../types"

export async function createTryOn(payload: CreateTryOnRequest): Promise<TryOnJob> {
  return apiRequest<TryOnJob>(
    apiClient.post<ApiSuccess<TryOnJob>>(tryOnEndpoints.create, payload)
  )
}
