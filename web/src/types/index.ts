/**
 * Appendix B - Core Type Reference
 *
 * Unified application types reflecting the canonical contract.
 */

export type User = {
  id: string
  name: string
  email: string
  created_at: string
}

export type PersonUpload = {
  id: string
  image_url: string
  width?: number | null
  height?: number | null
  created_at: string
}

export type Outfit = {
  id: string
  name: string
  category?: string
  image_url: string
  is_favorite?: boolean
}

export type TryOnStatus = "queued" | "processing" | "succeeded" | "failed" | "cancelled"

export type TryOnJob = {
  id: string
  status: TryOnStatus
  progress?: number | null
  person_upload?: PersonUpload
  outfit?: Outfit
  result?: { id: string; image_url: string } | null
  error?: { code?: string; message: string } | null
  created_at: string
  updated_at: string
}

export * from "./pagination"
