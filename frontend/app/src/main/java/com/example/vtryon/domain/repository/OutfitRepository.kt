package com.example.vtryon.domain.repository

import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.domain.model.Outfit
import com.example.vtryon.domain.model.OutfitCategory
import kotlinx.coroutines.flow.Flow

/**
 * Domain boundary contract for clothing catalogue retrieval and local caching.
 */
interface OutfitRepository {

    fun observeOutfits(category: OutfitCategory? = null): Flow<List<Outfit>>

    suspend fun refreshOutfits(): AppResult<Unit>

    suspend fun getOutfit(id: String): AppResult<Outfit>
}
