package com.example.vtryon.data.remote.tryon.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class CreateTryOnRequestDto(
    @SerialName("person_upload_id")
    val personUploadId: String,
    @SerialName("outfit_id")
    val outfitId: String
)

@Serializable
data class TryOnErrorDto(
    val code: String,
    val message: String
)

@Serializable
data class TryOnResultDto(
    val id: String,
    @SerialName("image_url")
    val imageUrl: String,
    val width: Int? = null,
    val height: Int? = null,
    @SerialName("model_version")
    val modelVersion: String? = null,
    @SerialName("created_at")
    val createdAt: String? = null
)

@Serializable
data class TryOnJobResponseDto(
    val id: String,
    val status: String,
    @SerialName("person_upload_id")
    val personUploadId: String,
    @SerialName("outfit_id")
    val outfitId: String,
    val result: TryOnResultDto? = null,
    val error: TryOnErrorDto? = null,
    @SerialName("created_at")
    val createdAt: String? = null,
    @SerialName("started_at")
    val startedAt: String? = null,
    @SerialName("finished_at")
    val finishedAt: String? = null
)

@Serializable
data class TryOnOutfitSummaryDto(
    val id: String,
    val name: String? = null,
    val category: String? = null,
    @SerialName("thumbnail_url")
    val thumbnailUrl: String? = null
)

@Serializable
data class TryOnListItemDto(
    val id: String,
    val status: String,
    @SerialName("person_upload_id")
    val personUploadId: String,
    @SerialName("outfit_id")
    val outfitId: String = "",
    val outfit: TryOnOutfitSummaryDto? = null,
    val result: TryOnResultDto? = null,
    @SerialName("created_at")
    val createdAt: String? = null
)
