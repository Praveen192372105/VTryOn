// Types
export type {
  PersonUpload,
  Upload,
  UploadListResponse,
  PaginationMetadata,
  DecodedImageMetadata,
  ValidationResult,
  ImageValidationIssue,
  ValidationIssueCode,
} from "./types"

// Constants
export {
  MAX_PERSON_UPLOAD_MB,
  MAX_PERSON_UPLOAD_BYTES,
  ACCEPTED_IMAGE_MIME_TYPES,
  ACCEPTED_IMAGE_TYPES_STRING,
  MIN_IMAGE_DIMENSION,
  MAX_IMAGE_DIMENSION,
  MAX_IMAGE_PIXELS,
  WARNING_MIN_DIMENSION,
  WARNING_MAX_ASPECT_RATIO,
  STORAGE_SELECTED_PERSON_KEY,
} from "./constants"

// API
export {
  createPersonUpload,
  uploadPersonImage,
  listUploads,
  getUpload,
  deleteUpload,
  uploadKeys,
} from "./api"

// Hooks
export {
  usePersonUploads,
  useCreatePersonUpload,
  useDeleteUpload,
  useCurrentPersonUpload,
  setSelectedPersonUploadId,
  clearSelectedPersonUpload,
  useUploads,
  useUploadImage,
} from "./hooks"

// Lib & Helpers
export {
  validatePersonImagePreDecode,
  validatePersonImagePostDecode,
  decodeImageMetadata,
  PreviewUrlManager,
  safeRevokeObjectUrl,
  resolveMediaUrl,
} from "./lib"

// Components
export {
  FramingGuidance,
  FramingTipsCard,
  PersonUploadDropzone,
  PersonUploadPreview,
  UploadCard,
  UploadGrid,
  UploadDeleteDialog,
  // Appendix C Aliases
  PersonUploadDropzone as PersonUploader,
  PersonUploadDropzone as UploadDropzone,
  PersonUploadPreview as PersonPreview,
  UploadDeleteDialog as DeleteUploadDialog,
} from "./components"
export type {
  FramingGuidanceProps,
  PersonUploadDropzoneProps,
  PersonUploadPreviewProps,
  UploadCardProps,
  UploadGridProps,
  UploadDeleteDialogProps,
} from "./components"
