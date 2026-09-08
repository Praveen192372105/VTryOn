import type { PaginationMeta } from "../../types/pagination"

export type UploadStatus = "active" | "deleted" | "processing" | "failed"

export interface PersonUpload {
  id: string
  original_filename?: string
  mime_type: string
  width?: number | null
  height?: number | null
  size_bytes: number
  status: UploadStatus | string
  image_url: string
  created_at: string
  updated_at?: string | null

  // Backward-compatibility properties
  user_id?: string
  storage_path?: string
  public_url?: string
}

// Backward-compatible aliases
export type Upload = PersonUpload
export type PersonUploadListItem = PersonUpload

export interface PaginationMetadata {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface UploadListResponse {
  items: PersonUpload[]
  pagination?: PaginationMetadata
  meta?: PaginationMeta // Backward compatibility
}

export type PersonUploadListResponse = UploadListResponse

export interface DecodedImageMetadata {
  width: number
  height: number
  aspectRatio: number
  format: string
}

export type ValidationIssueCode =
  | "unsupported-type"
  | "too-large"
  | "decode-failed"
  | "dimensions-too-small"
  | "dimensions-too-large"
  | "pixel-limit-exceeded"
  | "very-small"
  | "wide-framing"

export interface ImageValidationIssue {
  code: ValidationIssueCode
  severity: "error" | "warning"
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ImageValidationIssue[]
  warnings: ImageValidationIssue[]
  issues: ImageValidationIssue[]
}
