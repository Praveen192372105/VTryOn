package com.example.vtryon.core.database

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "outfits",
    indices = [
        Index(value = ["publicId"], unique = true),
        Index(value = ["category"])
    ]
)
data class OutfitEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val publicId: String,
    val name: String,
    val slug: String,
    val category: String,
    val imageStorageKey: String,
    val thumbnailStorageKey: String?,
    val description: String?,
    val sortOrder: Int = 0,
    val isActive: Boolean = true,
    val isFavorited: Boolean = false,
    val cachedAt: Long = System.currentTimeMillis()
)
