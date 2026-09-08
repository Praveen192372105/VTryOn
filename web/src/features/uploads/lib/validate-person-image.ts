import {
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_PERSON_UPLOAD_BYTES,
  MAX_PERSON_UPLOAD_MB,
  MIN_IMAGE_DIMENSION,
  MAX_IMAGE_DIMENSION,
  MAX_IMAGE_PIXELS,
  WARNING_MIN_DIMENSION,
  WARNING_MAX_ASPECT_RATIO,
} from "../constants"
import type {
  DecodedImageMetadata,
  ImageValidationIssue,
  ValidationResult,
} from "../types"

function compileValidationResult(issues: ImageValidationIssue[]): ValidationResult {
  const errors = issues.filter((i) => i.severity === "error")
  const warnings = issues.filter((i) => i.severity === "warning")
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    issues,
  }
}

/**
 * Early client-side validation before attempting browser image decode.
 * Validates MIME type and file size against backend constraints.
 */
export function validatePersonImagePreDecode(file: File): ValidationResult {
  const issues: ImageValidationIssue[] = []

  // 1. File size empty check
  if (file.size === 0) {
    issues.push({
      code: "too-large",
      severity: "error",
      message: "The selected image file is empty (0 bytes).",
    })
    return compileValidationResult(issues)
  }

  // 2. MIME type check
  const normalizedType = (file.type || "").toLowerCase().trim()
  const isAcceptedType = ACCEPTED_IMAGE_MIME_TYPES.some((type) => type === normalizedType)
  
  // Also check extension fallback for files with missing or generic browser MIME
  const fileName = (file.name || "").toLowerCase()
  const hasAcceptedExtension =
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".webp")

  if (!isAcceptedType && !hasAcceptedExtension) {
    issues.push({
      code: "unsupported-type",
      severity: "error",
      message: "This image format isn't supported. Choose a JPEG, PNG or WebP image.",
    })
  }

  // 3. File size ceiling check (12 MB)
  if (file.size > MAX_PERSON_UPLOAD_BYTES) {
    issues.push({
      code: "too-large",
      severity: "error",
      message: `This image is larger than the ${MAX_PERSON_UPLOAD_MB} MB upload limit. Choose a smaller image.`,
    })
  }

  return compileValidationResult(issues)
}

/**
 * Post-decode validation inspecting natural dimensions, total pixel limits,
 * and generating non-blocking portrait framing recommendations.
 */
export function validatePersonImagePostDecode(metadata: DecodedImageMetadata): ValidationResult {
  const issues: ImageValidationIssue[] = []
  const { width, height, aspectRatio } = metadata

  // Server hard constraint: Minimum dimensions
  if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
    issues.push({
      code: "dimensions-too-small",
      severity: "error",
      message: `Image dimensions (${width}×${height}) are below the minimum required ${MIN_IMAGE_DIMENSION}×${MIN_IMAGE_DIMENSION} pixels.`,
    })
  }

  // Server hard constraint: Maximum dimensions
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    issues.push({
      code: "dimensions-too-large",
      severity: "error",
      message: `Image dimensions (${width}×${height}) exceed the maximum allowed ${MAX_IMAGE_DIMENSION}×${MAX_IMAGE_DIMENSION} pixels.`,
    })
  }

  // Server hard constraint: Total pixel limit
  const totalPixels = width * height
  if (totalPixels > MAX_IMAGE_PIXELS) {
    issues.push({
      code: "pixel-limit-exceeded",
      severity: "error",
      message: `Image total resolution exceeds the maximum allowed limit of ${MAX_IMAGE_PIXELS / 1_000_000} megapixels.`,
    })
  }

  // Non-blocking UX warning: Very small image (< 512px)
  if (
    issues.length === 0 &&
    (width < WARNING_MIN_DIMENSION || height < WARNING_MIN_DIMENSION)
  ) {
    issues.push({
      code: "very-small",
      severity: "warning",
      message: "This image is quite small, so the generated result may lose detail. A larger image may work better.",
    })
  }

  // Non-blocking UX warning: Wide landscape image (aspect ratio > 1.2)
  if (aspectRatio > WARNING_MAX_ASPECT_RATIO) {
    issues.push({
      code: "wide-framing",
      severity: "warning",
      message: "This photo is quite wide. A portrait photo with the person clearly visible may produce a better try-on.",
    })
  }

  return compileValidationResult(issues)
}
