package com.example.vtryon.data.remote.outfit.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class OutfitDto(
    val id: String,
    val name: String,
    val category: String,
    @SerialName("image_url")
    val imageUrl: String,
    val description: String? = null,
    val tags: List<String> = emptyList(),
    @SerialName("is_available")
    val isAvailable: Boolean = true,
    @SerialName("is_favorite")
    val isFavorite: Boolean = false
)

@Serializable
data class CreateCustomOutfitResponseDto(
    val id: String,
    val name: String,
    val category: String,
    @SerialName("image_url")
    val imageUrl: String
)
