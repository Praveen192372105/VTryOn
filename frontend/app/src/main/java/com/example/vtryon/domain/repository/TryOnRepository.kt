package com.example.vtryon.domain.repository

import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.domain.model.OutfitCategory
import com.example.vtryon.domain.model.TryOnJob
import kotlinx.coroutines.flow.Flow
import java.io.File

/**
 * Domain boundary contract for AI virtual try-on execution, polling, and job history.
 */
interface TryOnRepository {

    suspend fun createTryOn(
        personImageFile: File,
        garmentId: String?,
        customGarmentFile: File?,
        category: OutfitCategory
    ): AppResult<TryOnJob>

    fun observeTryOn(id: String): Flow<TryOnJob?>

    suspend fun pollTryOnStatus(id: String): AppResult<TryOnJob>

    fun observeTryOnHistory(): Flow<List<TryOnJob>>

    suspend fun refreshTryOnHistory(): AppResult<Unit>

    suspend fun deleteTryOn(id: String): AppResult<Unit>

    suspend fun toggleSaveTryOn(id: String, isSaved: Boolean): AppResult<Unit>

    suspend fun getActiveJob(): TryOnJob?

    suspend fun clearActiveJob()
}
