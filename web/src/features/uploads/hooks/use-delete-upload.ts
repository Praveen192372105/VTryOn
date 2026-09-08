import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { deleteUpload } from "../api/delete-upload"
import { uploadKeys } from "../query-keys"
import { STORAGE_SELECTED_PERSON_KEY } from "../constants"
import { setSelectedPersonUploadId } from "./use-current-person-upload"
import { AppApiError } from "@/lib/api/errors"

export function useDeleteUpload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uploadId: string) => deleteUpload(uploadId),
    // Critical: Never automatically retry destructive deletion
    retry: false,
    onSuccess: (_, uploadId) => {
      // Invalidate upload collection and detail queries
      queryClient.invalidateQueries({ queryKey: uploadKeys.lists() })
      queryClient.invalidateQueries({ queryKey: uploadKeys.detail(uploadId) })

      // If the deleted upload was currently selected, clear selection immediately
      try {
        if (localStorage.getItem(STORAGE_SELECTED_PERSON_KEY) === uploadId) {
          setSelectedPersonUploadId(null)
        }
      } catch {
        // Ignore localStorage error
      }

      toast.success("Photo deleted")
    },
    onError: (error: unknown) => {
      if (error instanceof AppApiError) {
        if (error.status === 409 || error.code === "UPLOAD_IN_USE") {
          toast.error("This photo can't be deleted while a try-on is still using it.")
          return
        }
        if (error.status === 404 || error.code === "UPLOAD_NOT_FOUND") {
          toast.error("This photo could not be found.")
          return
        }
      }
      const message = error instanceof Error ? error.message : "Failed to delete photo"
      toast.error(message)
    },
  })
}
