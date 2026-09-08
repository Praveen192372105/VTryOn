package com.example.vtryon.core.common.error

/**
 * Domain-level typed error hierarchy.
 * The presentation layer renders these semantic errors rather than raw HTTP/network exceptions.
 */
sealed interface AppError {

    /** Device has no active network connectivity. */
    data object NetworkUnavailable : AppError

    /** Authentication token is missing, expired, or rejected (HTTP 401). */
    data object Unauthorized : AppError

    /** Request timed out waiting for server or CatVTON pipeline response. */
    data object Timeout : AppError

    /** Backend service is unreachable, offline, or experiencing internal error (HTTP 5xx). */
    data object ServerUnavailable : AppError

    /** Selected image could not be decoded or is corrupted. */
    data object InvalidImage : AppError

    /** Selected image exceeds max upload size limits (e.g., > 10MB). */
    data object ImageTooLarge : AppError

    /** Requested outfit does not exist in local database or remote catalogue. */
    data object OutfitNotFound : AppError

    /** Virtual try-on pipeline generation failed on the server. */
    data object TryOnFailed : AppError

    /** Unmapped or unexpected runtime error with optional underlying cause. */
    data class Unknown(val cause: Throwable? = null) : AppError
}
