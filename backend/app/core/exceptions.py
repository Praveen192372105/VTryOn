from typing import Any, Optional
from fastapi import status

from app.core.constants import ErrorCode


class AppError(Exception):
    """Base application exception for all domain, service, and infrastructure errors."""
    code: str = ErrorCode.APP_ERROR
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    message: str = "An unexpected application error occurred."

    def __init__(
        self,
        message: Optional[str] = None,
        code: Optional[str] = None,
        status_code: Optional[int] = None,
        details: Optional[Any] = None,
        retry_after: Optional[int] = None,
    ):
        if message is not None:
            self.message = message
        if code is not None:
            self.code = code
        if status_code is not None:
            self.status_code = status_code
        self.details = details
        self.retry_after = retry_after
        super().__init__(self.message)


# Configuration & General Errors
class ConfigurationError(AppError):
    code = ErrorCode.CONFIGURATION_ERROR
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    message = "Invalid or missing application configuration."


# Compatibility status constants to avoid Starlette deprecation warnings
HTTP_422 = getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422)
HTTP_413 = getattr(status, "HTTP_413_CONTENT_TOO_LARGE", 413)


class ServiceUnavailableError(AppError):
    code = ErrorCode.SERVICE_UNAVAILABLE
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    message = "A required service is temporarily unavailable."


class ValidationError(AppError):
    code = ErrorCode.VALIDATION_ERROR
    status_code = HTTP_422
    message = "One or more request fields failed validation."


# Authentication & Authorization Errors
class AuthenticationRequiredError(AppError):
    code = "AUTHENTICATION_REQUIRED"
    status_code = status.HTTP_401_UNAUTHORIZED
    message = "Authentication credentials are required to access this resource."


class InvalidCredentialsError(AppError):
    code = "INVALID_CREDENTIALS"
    status_code = status.HTTP_401_UNAUTHORIZED
    message = "Invalid email or password."


class SessionExpiredError(AppError):
    code = "SESSION_EXPIRED"
    status_code = status.HTTP_401_UNAUTHORIZED
    message = "Your authentication session has expired. Please log in again."


class InvalidTokenError(AppError):
    code = ErrorCode.INVALID_ACCESS_TOKEN
    status_code = status.HTTP_401_UNAUTHORIZED
    message = "Invalid or malformed authentication token."


class InvalidAccessTokenError(InvalidTokenError):
    code = ErrorCode.INVALID_ACCESS_TOKEN
    message = "Invalid or malformed access token."


class TokenExpiredError(SessionExpiredError):
    code = ErrorCode.ACCESS_TOKEN_EXPIRED
    status_code = status.HTTP_401_UNAUTHORIZED
    message = "The authentication token has expired."


class AccessTokenExpiredError(TokenExpiredError):
    code = ErrorCode.ACCESS_TOKEN_EXPIRED
    message = "The access token has expired."


class InvalidRefreshTokenError(AppError):
    code = ErrorCode.INVALID_REFRESH_TOKEN
    status_code = status.HTTP_401_UNAUTHORIZED
    message = "Invalid or malformed refresh token."


class RefreshTokenExpiredError(SessionExpiredError):
    code = ErrorCode.REFRESH_TOKEN_EXPIRED
    status_code = status.HTTP_401_UNAUTHORIZED
    message = "The refresh token has expired. Please log in again."


class SessionRevokedError(AppError):
    code = ErrorCode.SESSION_REVOKED
    status_code = status.HTTP_401_UNAUTHORIZED
    message = "This authentication session has been revoked."


class AccountInactiveError(AppError):
    code = ErrorCode.ACCOUNT_INACTIVE
    status_code = status.HTTP_401_UNAUTHORIZED
    message = "This user account is inactive or disabled."


class EmailAlreadyRegisteredError(AppError):
    code = ErrorCode.EMAIL_ALREADY_REGISTERED
    status_code = status.HTTP_409_CONFLICT
    message = "A user with this email address is already registered."


class AccessDeniedError(AppError):
    code = ErrorCode.FORBIDDEN
    status_code = status.HTTP_403_FORBIDDEN
    message = "You do not have permission to perform this action."


# Resource Not Found & Conflict
class ResourceNotFoundError(AppError):
    code = ErrorCode.RESOURCE_NOT_FOUND
    status_code = status.HTTP_404_NOT_FOUND
    message = "The requested resource was not found."


class ResourceConflictError(AppError):
    code = ErrorCode.RESOURCE_CONFLICT
    status_code = status.HTTP_409_CONFLICT
    message = "A resource conflict occurred."


# Upload & Image Validation Errors
class UploadRequiredError(AppError):
    code = ErrorCode.UPLOAD_REQUIRED
    status_code = HTTP_422
    message = "An image file upload is required."


class EmptyUploadError(AppError):
    code = ErrorCode.EMPTY_UPLOAD
    status_code = HTTP_422
    message = "Uploaded image file is empty (0 bytes)."


class UploadNotFoundError(ResourceNotFoundError):
    code = ErrorCode.UPLOAD_NOT_FOUND
    message = "Uploaded person image not found."


class UploadInUseError(ResourceConflictError):
    code = ErrorCode.UPLOAD_IN_USE
    message = "Cannot delete upload because active try-on jobs depend on it."


class UploadTooLargeError(AppError):
    code = ErrorCode.UPLOAD_TOO_LARGE
    status_code = HTTP_413
    message = "Uploaded image file exceeds the maximum allowed size limit."


ImageTooLargeError = UploadTooLargeError
FileTooLargeError = UploadTooLargeError


class UnsupportedImageTypeError(AppError):
    code = ErrorCode.UNSUPPORTED_IMAGE_TYPE
    status_code = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
    message = "Unsupported image format. Allowed formats: JPEG, PNG, WebP."


UnsupportedFileTypeError = UnsupportedImageTypeError


class InvalidImageError(AppError):
    code = ErrorCode.INVALID_IMAGE
    status_code = HTTP_422
    message = "The provided file is corrupt, unreadable, or not a valid image."


class ImageDimensionsInvalidError(AppError):
    code = ErrorCode.IMAGE_DIMENSIONS_INVALID
    status_code = HTTP_422
    message = "Image dimensions are outside the acceptable limits."


ImageDimensionsError = ImageDimensionsInvalidError


class ImagePixelLimitExceededError(AppError):
    code = ErrorCode.IMAGE_PIXEL_LIMIT_EXCEEDED
    status_code = HTTP_422
    message = "Total image pixel count exceeds the maximum allowed decompression limit."


ImagePixelLimitError = ImagePixelLimitExceededError


class AnimatedImageNotSupportedError(AppError):
    code = ErrorCode.ANIMATED_IMAGE_NOT_SUPPORTED
    status_code = HTTP_422
    message = "Animated images (e.g. animated WebP or GIF) are not supported for person try-on."


AnimatedImageError = AnimatedImageNotSupportedError


class StorageError(AppError):
    code = ErrorCode.STORAGE_ERROR
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    message = "A storage error occurred while reading or writing media files."


class UploadStorageFailedError(StorageError):
    code = ErrorCode.UPLOAD_STORAGE_FAILED
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    message = "Storage persistence failed. Please try again later."


class UploadPersistenceFailedError(AppError):
    code = ErrorCode.UPLOAD_PERSISTENCE_FAILED
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    message = "Failed to persist upload metadata record."


class InvalidStorageKeyError(StorageError):
    code = "INVALID_STORAGE_KEY"
    status_code = status.HTTP_400_BAD_REQUEST
    message = "Invalid or dangerous storage key."


class StorageObjectNotFoundError(ResourceNotFoundError, StorageError):
    code = "STORAGE_OBJECT_NOT_FOUND"
    message = "Storage object was not found."


# Outfit & Favorite Errors
class OutfitNotFoundError(ResourceNotFoundError):
    code = ErrorCode.OUTFIT_NOT_FOUND
    message = "Outfit catalogue item not found."


class OutfitInactiveError(AppError):
    code = ErrorCode.OUTFIT_INACTIVE
    status_code = status.HTTP_400_BAD_REQUEST
    message = "The requested outfit is currently unavailable in the catalogue."


class FavoriteNotFoundError(ResourceNotFoundError):
    code = ErrorCode.FAVORITE_NOT_FOUND
    message = "Favorite outfit record not found."


# Try-On State & Execution Errors
class TryOnJobNotFoundError(ResourceNotFoundError):
    code = ErrorCode.TRYON_JOB_NOT_FOUND
    message = "Virtual try-on job not found."


class InvalidTryOnTransitionError(ResourceConflictError):
    code = ErrorCode.TRYON_INVALID_STATE
    message = "Illegal try-on job state transition."


class TryOnJobActiveError(ResourceConflictError):
    code = ErrorCode.TRYON_JOB_IN_PROGRESS
    message = "This virtual try-on is currently being processed and cannot be deleted."


TryOnJobInProgressError = TryOnJobActiveError


class TryOnCreationFailedError(AppError):
    code = ErrorCode.TRYON_CREATION_FAILED
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    message = "Failed to create and queue virtual try-on job."


class QueueSubmissionError(ServiceUnavailableError):
    code = ErrorCode.TRYON_QUEUE_UNAVAILABLE
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    message = "The try-on processing queue is temporarily unavailable. Please try again shortly."


class TryOnProcessingFailedError(AppError):
    code = ErrorCode.TRYON_PROCESSING_FAILED
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    message = "Virtual try-on processing failed during execution."


class ResultNotFoundError(ResourceNotFoundError):
    code = ErrorCode.RESULT_NOT_FOUND
    message = "Try-on result is not ready or does not exist."


# Infrastructure Errors
class DatabaseUnavailableError(ServiceUnavailableError):
    code = ErrorCode.DATABASE_UNAVAILABLE
    message = "The service is temporarily unable to access persistent database storage."


class RedisUnavailableError(ServiceUnavailableError):
    code = ErrorCode.REDIS_UNAVAILABLE
    message = "The service is temporarily unable to access the Redis message broker/cache."


class StorageUnavailableError(ServiceUnavailableError):
    code = ErrorCode.STORAGE_UNAVAILABLE
    message = "The service is temporarily unable to access media storage."




# AI / CatVTON Exceptions
class CatVTONError(AppError):
    code = ErrorCode.CATVTON_UNAVAILABLE
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    message = "CatVTON AI pipeline error."


class CatVTONConfigurationError(CatVTONError):
    code = ErrorCode.CATVTON_CONFIGURATION_ERROR
    message = "CatVTON runtime configuration is invalid or missing required paths."


class CatVTONRuntimeError(CatVTONError):
    code = ErrorCode.CATVTON_RUNTIME_ERROR
    message = "CatVTON execution failed due to an environmental or runtime dependency error."


class CatVTONModelLoadError(CatVTONError):
    code = ErrorCode.CATVTON_MODEL_LOAD_ERROR
    message = "Failed to load CatVTON model checkpoints."


class CatVTONInferenceError(CatVTONError):
    code = ErrorCode.CATVTON_INFERENCE_ERROR
    message = "Inference failed during virtual try-on computation."


class CatVTONOOMError(CatVTONError):
    code = ErrorCode.CATVTON_OOM_ERROR
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    message = "AI Worker GPU memory limit exceeded. Please try again shortly."


class WorkerUnavailableError(ServiceUnavailableError):
    code = ErrorCode.WORKER_UNAVAILABLE
    message = "AI background inference workers are currently unavailable."


# Rate Limiting & Resource Capacity Errors (Phase 13)
class RateLimitExceededError(AppError):
    code = ErrorCode.RATE_LIMIT_EXCEEDED
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    message = "Too many requests. Please try again shortly."

    def __init__(
        self,
        message: Optional[str] = None,
        retry_after: Optional[int] = None,
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message or self.message,
            code=self.code,
            status_code=self.status_code,
            details=details,
            retry_after=retry_after,
        )


class UserTryOnCapacityExceededError(AppError):
    code = ErrorCode.TRYON_CAPACITY_LIMIT
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    message = "You already have the maximum number of active virtual try-ons."


class SystemTryOnCapacityUnavailableError(ServiceUnavailableError):
    code = ErrorCode.TRYON_CAPACITY_UNAVAILABLE
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    message = "The virtual try-on processing queue is currently at capacity. Please try again shortly."

