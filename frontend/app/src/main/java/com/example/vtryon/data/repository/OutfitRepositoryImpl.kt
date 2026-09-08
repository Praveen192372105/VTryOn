package com.example.vtryon.data.repository

import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.core.database.OutfitDao
import com.example.vtryon.core.network.NetworkErrorMapper
import com.example.vtryon.data.mapper.toDomain
import com.example.vtryon.data.mapper.toEntity
import com.example.vtryon.data.remote.outfit.OutfitApi
import com.example.vtryon.domain.model.Outfit
import com.example.vtryon.domain.model.OutfitCategory
import com.example.vtryon.domain.repository.OutfitRepository
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext

class OutfitRepositoryImpl(
    private val outfitApi: OutfitApi,
    private val outfitDao: OutfitDao,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) : OutfitRepository {

    override fun observeOutfits(category: OutfitCategory?): Flow<List<Outfit>> {
        val flow: Flow<List<com.example.vtryon.core.database.OutfitEntity>> = if (category != null) {
            outfitDao.observeByCategory(category.apiValue)
        } else {
            outfitDao.observeAll()
        }
        return flow.map { entities -> entities.map { it.toDomain() } }
    }

    override suspend fun refreshOutfits(): AppResult<Unit> = withContext(ioDispatcher) {
        try {
            val response = outfitApi.getOutfits()
            if (response.isSuccessful) {
                val dtos = response.body()?.data ?: emptyList()
                val entities = dtos.map { it.toDomain().toEntity() }
                outfitDao.replaceAll(entities)
                AppResult.Success(Unit)
            } else {
                AppResult.Error(NetworkErrorMapper.mapHttpCode(response.code(), null, null))
            }
        } catch (t: Throwable) {
            AppResult.Error(NetworkErrorMapper.map(t))
        }
    }

    override suspend fun getOutfit(id: String): AppResult<Outfit> = withContext(ioDispatcher) {
        // 1. Check local Room database cache
        val local = outfitDao.getByPublicId(id)
        if (local != null) {
            return@withContext AppResult.Success(local.toDomain())
        }

        // 2. Fetch from remote
        try {
            val response = outfitApi.getOutfit(id)
            if (response.isSuccessful) {
                val dto = response.body()?.data
                    ?: return@withContext AppResult.Error(AppError.OutfitNotFound)
                val domainOutfit = dto.toDomain()
                outfitDao.insert(domainOutfit.toEntity())
                AppResult.Success(domainOutfit)
            } else {
                AppResult.Error(NetworkErrorMapper.mapHttpCode(response.code(), null, null))
            }
        } catch (t: Throwable) {
            AppResult.Error(NetworkErrorMapper.map(t))
        }
    }
}
