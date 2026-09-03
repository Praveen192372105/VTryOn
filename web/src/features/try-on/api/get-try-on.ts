import { apiClient, apiRequest } from "../../../lib/api/client"
import type { ApiSuccess } from "../../../lib/api/types"
import type { TryOnJob } from "../types"

export async function getTryOn(jobId: string): Promise<TryOnJob> {
  return apiRequest<TryOnJob>(
    apiClient.get<ApiSuccess<TryOnJob>>(`/try-ons/${jobId}`)
  )
}
