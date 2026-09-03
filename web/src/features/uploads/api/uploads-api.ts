import { apiClient, apiRequest } from "../../../lib/api/client"
import type { ApiSuccess } from "../../../lib/api/types"
import type { Upload, UploadListResponse } from "../types"

export async function listUploads(params?: { page?: number; page_size?: number }): Promise<UploadListResponse> {
  return apiRequest<UploadListResponse>(
    apiClient.get<ApiSuccess<UploadListResponse>>("/uploads", { params })
  )
}

export async function uploadPersonImage(file: File): Promise<Upload> {
  const formData = new FormData()
  formData.append("file", file)

  return apiRequest<Upload>(
    apiClient.post<ApiSuccess<Upload>>("/uploads", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  )
}

export async function deleteUpload(uploadId: string): Promise<void> {
  await apiRequest<void>(
    apiClient.delete<ApiSuccess<void>>(`/uploads/${uploadId}`)
  )
}
