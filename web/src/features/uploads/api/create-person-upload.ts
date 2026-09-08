import { apiClient, apiRequest } from "@/lib/api/client"
import { uploadEndpoints } from "./endpoints"
import type { ApiSuccess } from "@/lib/api/types"
import type { PersonUpload } from "../types"

/**
 * Uploads a person photo via multipart/form-data.
 * Notice: Do NOT manually set Content-Type: multipart/form-data header.
 * Axios and the browser will automatically compute the multipart boundary.
 */
export async function createPersonUpload(file: File): Promise<PersonUpload> {
  const formData = new FormData()
  formData.append("file", file)

  return apiRequest<PersonUpload>(
    apiClient.post<ApiSuccess<PersonUpload>>(uploadEndpoints.createPerson, formData, {
      headers: {
        "Content-Type": undefined,
      },
    })
  )
}

// Backward-compatible alias
export const uploadPersonImage = createPersonUpload
