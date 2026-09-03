import type { PaginationMeta } from "../../types/pagination"

export type TryOnStatus = "queued" | "processing" | "succeeded" | "failed"

export interface TryOnJob {
  id: string
  user_id: string
  person_upload_id: string
  outfit_id: string
  status: TryOnStatus
  result_image_url?: string | null
  error_code?: string | null
  error_message?: string | null
  created_at: string
  updated_at?: string
  completed_at?: string | null
}

export interface CreateTryOnRequest {
  person_upload_id: string
  outfit_id: string
}

export interface TryOnListResponse {
  items: TryOnJob[]
  meta: PaginationMeta
}
