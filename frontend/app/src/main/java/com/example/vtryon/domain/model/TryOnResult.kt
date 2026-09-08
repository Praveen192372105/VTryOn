package com.example.vtryon.domain.model

/**
 * Domain representation of a completed try-on result.
 */
data class TryOnResult(
    val jobId: String,
    val resultImageUrl: String,
    val personImageUrl: String,
    val garmentImageUrl: String,
    val category: OutfitCategory,
    val latencySeconds: Double? = null,
    val createdAt: Long = System.currentTimeMillis()
)
