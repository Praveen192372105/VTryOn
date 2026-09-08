package com.example.vtryon.data.remote.upload.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class PersonUploadResponseDto(
    val id: String,
    @SerialName("image_url")
    val imageUrl: String,
    val width: Int? = null,
    val height: Int? = null,
    @SerialName("created_at")
    val createdAt: String? = null
)
