package com.example.vtryon.domain.model

/**
 * Domain representation of an outfit in the try-on catalogue.
 */
data class Outfit(
    val id: String,
    val name: String,
    val category: OutfitCategory,
    val imageUrl: String,
    val description: String? = null,
    val tags: List<String> = emptyList(),
    val isAvailable: Boolean = true,
    val isFavorite: Boolean = false
)
