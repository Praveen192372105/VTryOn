package com.example.vtryon.core.network

/**
 * Standardized domain-level errors.
 * Cleanly decouples UI error presentation from backend implementation details.
 */
sealed class AppError(open val userMessage: String, open val cause: Throwable? = null) {
    data class NetworkUnavailable(
        override val userMessage: String = "No internet connection. Please check your network and retry.",
        override val cause: Throwable? = null
    ) : AppError(userMessage, cause)

    data class Unauthorized(
        override val userMessage: String = "Invalid credentials. Please verify your details and try again.",
        override val cause: Throwable? = null
    ) : AppError(userMessage, cause)

    data class SessionExpired(
        override val userMessage: String = "Your session has expired. Please sign in again.",
        override val cause: Throwable? = null
    ) : AppError(userMessage, cause)

    data class InvalidImage(
        override val userMessage: String = "The selected image format or aspect ratio is invalid. Please select a clear JPG/PNG photo.",
        override val cause: Throwable? = null
    ) : AppError(userMessage, cause)

    data class PayloadTooLarge(
        override val userMessage: String = "The image file exceeds the upload limit. Please select a photo under 10 MB.",
        override val cause: Throwable? = null
    ) : AppError(userMessage, cause)

    data class OutfitNotFound(
        override val userMessage: String = "The selected garment was not found in the catalogue.",
        override val cause: Throwable? = null
    ) : AppError(userMessage, cause)

    data class TryOnFailed(
        override val userMessage: String = "Virtual try-on generation encountered an error. Please retry.",
        override val cause: Throwable? = null
    ) : AppError(userMessage, cause)

    data class ServerUnavailable(
        override val userMessage: String = "The try-on service is temporarily unavailable. Please try again shortly.",
        override val cause: Throwable? = null
    ) : AppError(userMessage, cause)

    data class Unknown(
        override val userMessage: String = "An unexpected error occurred. Please retry.",
        override val cause: Throwable? = null
    ) : AppError(userMessage, cause)
}
