export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiErrorDetail {
  code: string
  message: string
  details?: unknown
}

export interface ApiErrorPayload {
  success: false
  error: ApiErrorDetail
  request_id: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorPayload

export type TryOnStatus = "queued" | "processing" | "succeeded" | "failed"

export interface User {
  id: string
  email: string
  name: string
  created_at?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthSession {
  user: User
  tokens: AuthTokens
}

export interface Upload {
  id: string
  public_id: string
  original_filename: string
  width: number
  height: number
  url: string
  created_at?: string
}

export interface Outfit {
  id: string
  title: string
  description?: string
  category: "upper_body" | "lower_body" | "dresses"
  image_url: string
  brand?: string
  is_favorite?: boolean
  created_at?: string
}

export interface TryOnResult {
  id: string
  image_url: string
  width: number
  height: number
  mime_type?: string
  created_at?: string
}

export interface TryOnJob {
  id: string
  status: TryOnStatus
  person_upload_id: string
  outfit_id: string
  result?: TryOnResult | null
  error_message?: string | null
  created_at: string
  updated_at?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}
