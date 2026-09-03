import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createTryOn } from "../api/create-try-on"
import { tryOnKeys } from "../query-keys"
import type { CreateTryOnRequest, TryOnJob } from "../types"

export function useCreateTryOn() {
  const queryClient = useQueryClient()

  return useMutation<TryOnJob, Error, CreateTryOnRequest>({
    mutationFn: (payload: CreateTryOnRequest) => createTryOn(payload),
    retry: false,
    onSuccess: (newJob) => {
      // Seed detail query cache with returned initial job state
      queryClient.setQueryData(tryOnKeys.detail(newJob.id), newJob)
      // Invalidate job list so new job appears in history
      queryClient.invalidateQueries({ queryKey: tryOnKeys.lists() })
    },
  })
}
