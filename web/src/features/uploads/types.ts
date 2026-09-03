import type { PaginationMeta } from "../../types/pagination"

export interface Upload {
  id: string
  user_id: string
  original_filename: string
  storage_path: string
  public_url?: string
  width?: number
  height?: number
  created_at: string
}

export interface UploadListResponse {
  items: Upload[]
  meta: PaginationMeta
}
