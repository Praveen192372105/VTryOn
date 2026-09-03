import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { uploadKeys } from "../query-keys"
import { listUploads, uploadPersonImage, deleteUpload } from "../api/uploads-api"
import type { UploadListResponse } from "../types"

export function useUploads(params?: { page?: number; page_size?: number }) {
  return useQuery<UploadListResponse>({
    queryKey: uploadKeys.list(params),
    queryFn: () => listUploads(params),
  })
}

export function useUploadImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => uploadPersonImage(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: uploadKeys.lists() })
    },
  })
}

export function useDeleteUpload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uploadId: string) => deleteUpload(uploadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: uploadKeys.lists() })
    },
  })
}
