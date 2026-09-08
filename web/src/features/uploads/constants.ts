/**
 * Canonical frontend-safe constraints mirrored directly from the backend configuration:
 * backend/app/core/config.py (MediaSettings)
 */

export const MAX_PERSON_UPLOAD_MB = 12
export const MAX_PERSON_UPLOAD_BYTES = MAX_PERSON_UPLOAD_MB * 1024 * 1024 // 12,582,912 bytes

export const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export type AcceptedImageMimeType = (typeof ACCEPTED_IMAGE_MIME_TYPES)[number]

export const ACCEPTED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
] as const

export const ACCEPTED_IMAGE_TYPES_STRING = ACCEPTED_IMAGE_MIME_TYPES.join(",")

// Server hard bounds (backend/app/utils/images.py)
export const MIN_IMAGE_DIMENSION = 256
export const MAX_IMAGE_DIMENSION = 8192
export const MAX_IMAGE_PIXELS = 40_000_000

// UX Guidance thresholds (non-blocking warnings)
export const WARNING_MIN_DIMENSION = 512
export const WARNING_MAX_ASPECT_RATIO = 1.2 // Landscape threshold: width > height * 1.2

// Scoped client storage key for current selection (only public upload ID, never raw files)
export const STORAGE_SELECTED_PERSON_KEY = "vtryon_selected_person_id"
export const EVENT_SELECTED_PERSON_CHANGED = "vtryon:selected-person-changed"
