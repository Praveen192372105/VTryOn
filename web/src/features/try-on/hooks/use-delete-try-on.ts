import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { deleteTryOn } from "../api/delete-try-on"
import { tryOnKeys } from "../query-keys"
import { AppApiError } from "../../../lib/api/errors"

export function useDeleteTryOn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => deleteTryOn(jobId),
    // Critical: Never automatically retry destructive deletion
    retry: false,
    onSuccess: (_, jobId) => {
      // Invalidate all paginated list queries to reconcile count and items
      queryClient.invalidateQueries({ queryKey: tryOnKeys.lists() })
      // Completely remove detail query from cache so Back button does not re-render stale job
      queryClient.removeQueries({ queryKey: tryOnKeys.detail(jobId) })

      toast.success("Try-on deleted from history")
    },
    onError: (error: unknown) => {
      if (error instanceof AppApiError) {
        if (error.status === 409 || error.code === "TRYON_JOB_IN_PROGRESS") {
          toast.error("This try-on is still being created and can't be deleted yet.")
          return
        }
        if (error.status === 404 || error.code === "TRYON_NOT_FOUND") {
          toast.error("This try-on could not be found.")
          return
        }
      }
      const message = error instanceof Error ? error.message : "Failed to delete try-on"
      toast.error(message)
    },
  })
}
