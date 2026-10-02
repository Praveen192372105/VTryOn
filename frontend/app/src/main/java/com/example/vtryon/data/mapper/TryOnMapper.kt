package com.example.vtryon.data.mapper

import com.example.vtryon.core.database.TryOnEntity
import com.example.vtryon.core.network.UrlResolver
import com.example.vtryon.data.remote.tryon.dto.TryOnJobResponseDto
import com.example.vtryon.data.remote.tryon.dto.TryOnListItemDto
import com.example.vtryon.domain.model.OutfitCategory
import com.example.vtryon.domain.model.TryOnJob
import com.example.vtryon.domain.model.TryOnStatus

fun TryOnJobResponseDto.toDomain(): TryOnJob {
    val domainStatus = when (status.lowercase()) {
        "queued" -> TryOnStatus.QUEUED
        "processing" -> TryOnStatus.PROCESSING
        "succeeded", "completed" -> TryOnStatus.COMPLETED
        "failed" -> TryOnStatus.FAILED
        else -> TryOnStatus.QUEUED
    }

    return TryOnJob(
        id = id,
        personImageUrl = personUploadId,
        garmentImageUrl = outfitId,
        category = OutfitCategory.UPPER_BODY,
        status = domainStatus,
        resultImageUrl = UrlResolver.resolveMediaUrl(result?.imageUrl),
        failureReason = error?.message
    )
}

fun TryOnListItemDto.toDomain(): TryOnJob {
    val domainStatus = when (status.lowercase()) {
        "queued" -> TryOnStatus.QUEUED
        "processing" -> TryOnStatus.PROCESSING
        "succeeded", "completed" -> TryOnStatus.COMPLETED
        "failed" -> TryOnStatus.FAILED
        else -> TryOnStatus.QUEUED
    }

    val cat = when (outfit?.category?.lowercase()) {
        "upper_body", "tops" -> OutfitCategory.UPPER_BODY
        "lower_body", "bottoms" -> OutfitCategory.LOWER_BODY
        "dresses", "one_piece" -> OutfitCategory.DRESSES
        else -> OutfitCategory.UPPER_BODY
    }

    val garmentUrl = outfit?.thumbnailUrl?.takeIf { it.isNotBlank() } ?: outfitId

    return TryOnJob(
        id = id,
        personImageUrl = personUploadId,
        garmentImageUrl = garmentUrl,
        category = cat,
        status = domainStatus,
        resultImageUrl = UrlResolver.resolveMediaUrl(result?.imageUrl)
    )
}

fun TryOnEntity.toDomain(): TryOnJob {
    val domainStatus = when (status.lowercase()) {
        "queued" -> TryOnStatus.QUEUED
        "processing" -> TryOnStatus.PROCESSING
        "succeeded", "completed" -> TryOnStatus.COMPLETED
        "failed" -> TryOnStatus.FAILED
        else -> TryOnStatus.QUEUED
    }

    return TryOnJob(
        id = publicId,
        personImageUrl = personImageUrl ?: personImageStorageKey ?: "",
        garmentImageUrl = outfitPublicId ?: "",
        category = OutfitCategory.UPPER_BODY,
        status = domainStatus,
        resultImageUrl = resultImageUrl ?: resultImageStorageKey,
        failureReason = errorMessage,
        isSaved = isSavedLocally
    )
}

fun TryOnJob.toEntity(): TryOnEntity {
    return TryOnEntity(
        publicId = id,
        status = status.rawValue,
        personImageUrl = personImageUrl,
        outfitPublicId = garmentImageUrl,
        resultImageUrl = resultImageUrl,
        errorMessage = failureReason,
        isSavedLocally = isSaved,
        createdAt = createdAt.toString(),
        updatedAt = System.currentTimeMillis()
    )
}
