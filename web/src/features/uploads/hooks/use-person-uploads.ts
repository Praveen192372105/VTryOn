import { useQuery } from "@tanstack/react-query"
import { uploadKeys } from "../query-keys"
import { listUploads, type ListUploadsParams } from "../api/list-uploads"
import type { UploadListResponse, PersonUpload } from "../types"

export function usePersonUploads(params?: ListUploadsParams) {
  const query = useQuery<UploadListResponse>({
    queryKey: uploadKeys.list(params),
    queryFn: () => listUploads(params),
    staleTime: 30_000,
  })

  return {
    ...query,
    uploads: (query.data?.items || []) as PersonUpload[],
    pagination: query.data?.pagination,
  }
}
