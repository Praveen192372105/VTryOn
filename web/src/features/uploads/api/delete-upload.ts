import { apiClient, apiRequest } from "@/lib/api/client"
import { uploadEndpoints } from "./endpoints"
import type { ApiSuccess } from "@/lib/api/types"

export async function deleteUpload(uploadId: string): Promise<void> {
  await apiRequest<void>(
    apiClient.delete<ApiSuccess<void>>(uploadEndpoints.delete(uploadId))
  )
}
