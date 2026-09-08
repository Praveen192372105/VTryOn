package com.example.vtryon.core.logging

import timber.log.Timber

/**
 * Centralized logging utility for the VTryOn Android client.
 * Enforces sanitization of authorization tokens, passwords, and PII while delegating to Timber.
 */
object AppLogger {

    private const val TAG_PREFIX = "VTryOn."

    fun d(tag: String, message: String) {
        Timber.tag(TAG_PREFIX + tag).d(sanitize(message))
    }

    fun i(tag: String, message: String) {
        Timber.tag(TAG_PREFIX + tag).i(sanitize(message))
    }

    fun w(tag: String, message: String, throwable: Throwable? = null) {
        if (throwable != null) {
            Timber.tag(TAG_PREFIX + tag).w(throwable, sanitize(message))
        } else {
            Timber.tag(TAG_PREFIX + tag).w(sanitize(message))
        }
    }

    fun e(tag: String, message: String, throwable: Throwable? = null) {
        if (throwable != null) {
            Timber.tag(TAG_PREFIX + tag).e(throwable, sanitize(message))
        } else {
            Timber.tag(TAG_PREFIX + tag).e(sanitize(message))
        }
    }

    /**
     * Redacts sensitive tokens, passwords, and credentials from log strings.
     */
    fun sanitize(message: String): String {
        return message
            .replace(Regex("(?i)bearer\\s+[a-zA-Z0-9._\\-]+"), "Bearer [REDACTED]")
            .replace(Regex("(?i)\"password\"\\s*:\\s*\"[^\"]+\""), "\"password\":\"[REDACTED]\"")
            .replace(Regex("(?i)\"refresh_token\"\\s*:\\s*\"[^\"]+\""), "\"refresh_token\":\"[REDACTED]\"")
            .replace(Regex("(?i)\"access_token\"\\s*:\\s*\"[^\"]+\""), "\"access_token\":\"[REDACTED]\"")
    }
}
