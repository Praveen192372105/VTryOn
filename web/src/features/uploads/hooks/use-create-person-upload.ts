import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createPersonUpload } from "../api/create-person-upload"
import { uploadKeys } from "../query-keys"
import { setSelectedPersonUploadId } from "./use-current-person-upload"
import type { PersonUpload } from "../types"

export function useCreatePersonUpload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => createPersonUpload(file),
    // Critical: Never automatically retry multipart file uploads
    retry: false,
    onSuccess: (newUpload: PersonUpload) => {
      // Invalidate upload collection queries
      queryClient.invalidateQueries({ queryKey: uploadKeys.lists() })

      // Automatically select newly uploaded photo for Studio try-on workflow
      setSelectedPersonUploadId(newUpload.id)

      toast.success("Photo added")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload photo")
    },
  })
}

// Backward-compatible alias
export const useUploadImage = useCreatePersonUpload
