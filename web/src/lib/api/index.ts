export { apiClient, apiRequest, type CustomRequestConfig } from "./client"
export { bareClient } from "./bare-client"
export { coordinateTokenRefresh, isRefreshInProgress } from "./refresh-coordinator"
export { generateRequestId } from "./request-id"
export {
  AppApiError,
  normalizeApiError,
  ERROR_MESSAGES,
  getHumanErrorMessage,
  type AppApiErrorOptions,
} from "./errors"
export { fetchAuthenticatedBlob } from "./media"

export type {
  ApiSuccess,
  ApiSuccessEnvelope,
  ApiErrorDetail,
  ApiErrorPayload,
  ApiErrorEnvelope,
  ApiResponse,
  ApiPagination,
  ApiPage,
  ValidationErrorDetail,
  TryOnStatus,
  User,
  AuthTokens,
  BackendAuthResponse,
  AuthSession,
  Upload,
  Outfit,
  TryOnResult,
  TryOnJob,
  PaginationMeta,
} from "./types"
