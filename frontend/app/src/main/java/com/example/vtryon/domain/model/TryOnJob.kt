package com.example.vtryon.domain.model

/**
 * Domain representation of an asynchronous virtual try-on execution job.
 */
data class TryOnJob(
    val id: String,
    val personImageUrl: String,
    val garmentImageUrl: String,
    val category: OutfitCategory,
    val status: TryOnStatus,
    val resultImageUrl: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val completedAt: Long? = null,
    val failureReason: String? = null
)
