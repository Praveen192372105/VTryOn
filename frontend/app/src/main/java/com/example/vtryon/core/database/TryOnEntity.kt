package com.example.vtryon.core.database

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "try_on_jobs",
    indices = [
        Index(value = ["publicId"], unique = true),
        Index(value = ["status"])
    ]
)
data class TryOnEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val publicId: String,
    val status: String,
    val personImageStorageKey: String? = null,
    val personImageUrl: String? = null,
    val outfitPublicId: String? = null,
    val outfitName: String? = null,
    val resultImageStorageKey: String? = null,
    val resultImageUrl: String? = null,
    val errorMessage: String? = null,
    val isSavedLocally: Boolean = false,
    val createdAt: String? = null,
    val updatedAt: Long = System.currentTimeMillis()
)
