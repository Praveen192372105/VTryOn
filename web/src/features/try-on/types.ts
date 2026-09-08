import type { PaginationMeta } from "../../types/pagination"

export type TryOnStatus = "queued" | "processing" | "succeeded" | "failed"

export interface TryOnOutfitSummary {
  id: string
  name: string
  category: string
  thumbnail_url?: string | null
}

export interface TryOnResultSummary {
  id: string
  image_url: string
  width: number
  height: number
  model_version?: string | null
}

export interface TryOnError {
  code: string
  message: string
}

export interface TryOnResult {
  id: string
  image_url: string
  width: number
  height: number
  mime_type?: string
  model_version?: string | null
  inference_config_version?: string | null
  created_at: string
}

export interface TryOnJob {
  id: string
  status: TryOnStatus
  person_upload_id: string
  outfit_id: string
  result?: TryOnResult | null
  error?: TryOnError | null
  idempotency_key?: string | null
  created_at: string
  started_at?: string | null
  finished_at?: string | null

  // Backward-compatibility properties
  user_id?: string
  result_image_url?: string | null
  error_code?: string | null
  error_message?: string | null
  completed_at?: string | null
  updated_at?: string
}

export interface TryOnListItem {
  id: string
  status: TryOnStatus
  person_upload_id: string
  outfit?: TryOnOutfitSummary | null
  result?: TryOnResultSummary | null
  error?: TryOnError | null
  created_at: string
  started_at?: string | null
  finished_at?: string | null

  // Backward-compatibility properties
  job_id?: string
  outfit_id?: string
  completed_at?: string | null
  result_image_url?: string | null
}

export interface CreateTryOnRequest {
  person_upload_id: string
  outfit_id: string
}

export interface TryOnListParams {
  page?: number
  page_size?: number
  status?: TryOnStatus
}

export interface TryOnListResponse {
  items: TryOnListItem[]
  pagination: PaginationMeta
  meta?: PaginationMeta
}
