import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { uploadCustomOutfit, type UploadCustomOutfitParams } from "../api/upload-custom-outfit"
import { outfitKeys } from "../query-keys"
import { setSelectedOutfitId } from "./use-current-outfit"
import type { Outfit } from "../types"

export function useUploadCustomOutfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: UploadCustomOutfitParams) => uploadCustomOutfit(params),
    retry: false,
    onSuccess: (newOutfit: Outfit) => {
      // Invalidate outfits catalog queries so new custom garment appears
      queryClient.invalidateQueries({ queryKey: outfitKeys.lists() })

      // Automatically select newly uploaded garment for Studio try-on
      setSelectedOutfitId(newOutfit.id)

      toast.success("Garment uploaded successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload garment")
    },
  })
}
