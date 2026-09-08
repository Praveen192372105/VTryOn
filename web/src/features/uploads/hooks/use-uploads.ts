import { usePersonUploads } from "./use-person-uploads"
import { useCreatePersonUpload } from "./use-create-person-upload"
import { useDeleteUpload } from "./use-delete-upload"

// Backward-compatible wrappers
export const useUploads = usePersonUploads
export const useUploadImage = useCreatePersonUpload
export { useDeleteUpload }
