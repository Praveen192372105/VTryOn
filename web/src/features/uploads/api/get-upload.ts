import { apiClient, apiRequest } from "@/lib/api/client"
import { uploadEndpoints } from "./endpoints"
import type { ApiSuccess } from "@/lib/api/types"
import type { PersonUpload } from "../types"

export async function getUpload(uploadId: string): Promise<PersonUpload> {
  return apiRequest<PersonUpload>(
    apiClient.get<ApiSuccess<PersonUpload>>(uploadEndpoints.detail(uploadId))
  )
}
