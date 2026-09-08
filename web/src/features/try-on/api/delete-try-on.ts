import { apiClient, apiRequest } from "../../../lib/api/client"
import { tryOnEndpoints } from "./endpoints"
import type { ApiSuccess } from "../../../lib/api/types"

/**
 * Delete a completed virtual try-on job and associated generated result media.
 * Backend responds with 204 No Content for terminal jobs (succeeded, failed).
 * Active jobs (queued, processing) reject with 409 Conflict.
 */
export async function deleteTryOn(jobId: string): Promise<void> {
  await apiRequest<void>(
    apiClient.delete<ApiSuccess<void>>(tryOnEndpoints.delete(jobId))
  )
}
