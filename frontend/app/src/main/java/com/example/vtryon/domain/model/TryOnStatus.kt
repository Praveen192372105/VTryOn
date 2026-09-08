package com.example.vtryon.domain.model

/**
 * State machine values for background CatVTON virtual try-on execution.
 */
enum class TryOnStatus(val rawValue: String) {
    QUEUED("queued"),
    PROCESSING("processing"),
    COMPLETED("completed"),
    FAILED("failed");

    val isTerminal: Boolean get() = this == COMPLETED || this == FAILED

    companion object {
        fun fromRaw(value: String?): TryOnStatus {
            return entries.firstOrNull { it.rawValue.equals(value, ignoreCase = true) }
                ?: QUEUED
        }
    }
}
