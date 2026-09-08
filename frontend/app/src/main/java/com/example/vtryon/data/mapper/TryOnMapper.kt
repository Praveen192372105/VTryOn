package com.example.vtryon.data.mapper

import com.example.vtryon.core.database.TryOnEntity
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
        resultImageUrl = result?.imageUrl,
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

    return TryOnJob(
        id = id,
        personImageUrl = personUploadId,
        garmentImageUrl = outfitId,
        category = OutfitCategory.UPPER_BODY,
        status = domainStatus,
        resultImageUrl = result?.imageUrl
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
        failureReason = errorMessage
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
        createdAt = createdAt.toString(),
        updatedAt = System.currentTimeMillis()
    )
}
