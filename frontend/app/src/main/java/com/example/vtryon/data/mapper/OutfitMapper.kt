package com.example.vtryon.data.mapper

import com.example.vtryon.core.database.OutfitEntity
import com.example.vtryon.core.network.UrlResolver
import com.example.vtryon.data.remote.outfit.dto.OutfitDto
import com.example.vtryon.domain.model.Outfit
import com.example.vtryon.domain.model.OutfitCategory

fun OutfitDto.toDomain(): Outfit {
    return Outfit(
        id = id,
        name = name,
        category = OutfitCategory.fromApiValue(category),
        imageUrl = UrlResolver.resolveMediaUrl(imageUrl) ?: imageUrl,
        description = description,
        tags = tags,
        isAvailable = isAvailable,
        isFavorite = isFavorite
    )
}

fun OutfitEntity.toDomain(): Outfit {
    return Outfit(
        id = publicId,
        name = name,
        category = OutfitCategory.fromApiValue(category),
        imageUrl = imageStorageKey,
        description = description,
        isAvailable = isActive,
        isFavorite = isFavorited
    )
}

fun Outfit.toEntity(): OutfitEntity {
    return OutfitEntity(
        publicId = id,
        name = name,
        slug = name.lowercase().replace(" ", "_"),
        category = category.apiValue,
        imageStorageKey = imageUrl,
        thumbnailStorageKey = imageUrl,
        description = description,
        isActive = isAvailable,
        isFavorited = isFavorite,
        cachedAt = System.currentTimeMillis()
    )
}
