package com.example.vtryon.data.repository

import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.core.database.TryOnDao
import com.example.vtryon.core.network.NetworkErrorMapper
import com.example.vtryon.data.mapper.toDomain
import com.example.vtryon.data.mapper.toEntity
import com.example.vtryon.data.remote.outfit.OutfitApi
import com.example.vtryon.data.remote.tryon.TryOnApi
import com.example.vtryon.data.remote.tryon.dto.CreateTryOnRequestDto
import com.example.vtryon.data.remote.upload.UploadApi
import com.example.vtryon.domain.model.OutfitCategory
import com.example.vtryon.domain.model.TryOnJob
import com.example.vtryon.domain.model.TryOnStatus
import com.example.vtryon.domain.repository.TryOnRepository
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class TryOnRepositoryImpl(
    private val tryOnApi: TryOnApi,
    private val uploadApi: UploadApi,
    private val outfitApi: OutfitApi,
    private val tryOnDao: TryOnDao,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) : TryOnRepository {

    override fun observeTryOn(id: String): Flow<TryOnJob?> {
        return tryOnDao.observeByPublicId(id).map { it?.toDomain() }
    }

    override fun observeTryOnHistory(): Flow<List<TryOnJob>> {
        return tryOnDao.observeAll().map { entities -> entities.map { it.toDomain() } }
    }

    override suspend fun createTryOn(
        personImageFile: File,
        garmentId: String?,
        customGarmentFile: File?,
        category: OutfitCategory
    ): AppResult<TryOnJob> = withContext(ioDispatcher) {
        try {
            // 1. Upload person photo
            val personReqBody = personImageFile.asRequestBody("image/jpeg".toMediaTypeOrNull())
            val personPart = MultipartBody.Part.createFormData("file", personImageFile.name, personReqBody)
            val uploadResponse = uploadApi.uploadPersonImage(personPart)

            if (!uploadResponse.isSuccessful) {
                return@withContext AppResult.Error(NetworkErrorMapper.mapHttpCode(uploadResponse.code(), null, null))
            }
            val personUploadId = uploadResponse.body()?.data?.id
                ?: return@withContext AppResult.Error(AppError.InvalidImage)

            // 2. Resolve outfit identifier (either catalog outfit ID or newly uploaded custom garment)
            val resolvedOutfitId = if (!garmentId.isNullOrBlank()) {
                garmentId
            } else if (customGarmentFile != null && customGarmentFile.exists()) {
                val garmentReqBody = customGarmentFile.asRequestBody("image/jpeg".toMediaTypeOrNull())
                val garmentPart = MultipartBody.Part.createFormData("file", customGarmentFile.name, garmentReqBody)
                val nameBody = "Custom Garment".toRequestBody("text/plain".toMediaTypeOrNull())
                val categoryBody = category.apiValue.toRequestBody("text/plain".toMediaTypeOrNull())

                val customResponse = outfitApi.createCustomOutfit(garmentPart, nameBody, categoryBody)
                if (!customResponse.isSuccessful) {
                    return@withContext AppResult.Error(NetworkErrorMapper.mapHttpCode(customResponse.code(), null, null))
                }
                customResponse.body()?.data?.id ?: return@withContext AppResult.Error(AppError.OutfitNotFound)
            } else {
                return@withContext AppResult.Error(AppError.OutfitNotFound)
            }

            // 3. Queue try-on job
            val jobResponse = tryOnApi.createTryOn(
                CreateTryOnRequestDto(
                    personUploadId = personUploadId,
                    outfitId = resolvedOutfitId
                )
            )

            if (jobResponse.isSuccessful) {
                val dto = jobResponse.body()?.data
                    ?: return@withContext AppResult.Error(AppError.ServerUnavailable)
                val domainJob = dto.toDomain()
                tryOnDao.insert(domainJob.toEntity())
                AppResult.Success(domainJob)
            } else {
                AppResult.Error(NetworkErrorMapper.mapHttpCode(jobResponse.code(), null, null))
            }

        } catch (t: Throwable) {
            AppResult.Error(NetworkErrorMapper.map(t))
        }
    }

    override suspend fun pollTryOnStatus(id: String): AppResult<TryOnJob> = withContext(ioDispatcher) {
        try {
            val response = tryOnApi.getTryOn(id)
            if (response.isSuccessful) {
                val dto = response.body()?.data
                    ?: return@withContext AppResult.Error(AppError.TryOnFailed)
                val domainJob = dto.toDomain()
                tryOnDao.insert(domainJob.toEntity())
                AppResult.Success(domainJob)
            } else {
                AppResult.Error(NetworkErrorMapper.mapHttpCode(response.code(), null, null))
            }
        } catch (t: Throwable) {
            AppResult.Error(NetworkErrorMapper.map(t))
        }
    }

    override suspend fun refreshTryOnHistory(): AppResult<Unit> = withContext(ioDispatcher) {
        try {
            val response = tryOnApi.getTryOnHistory()
            if (response.isSuccessful) {
                val list = response.body()?.data ?: emptyList()
                val entities = list.map { it.toDomain().toEntity() }
                entities.forEach { tryOnDao.insert(it) }
                AppResult.Success(Unit)
            } else {
                AppResult.Error(NetworkErrorMapper.mapHttpCode(response.code(), null, null))
            }
        } catch (t: Throwable) {
            AppResult.Error(NetworkErrorMapper.map(t))
        }
    }

    override suspend fun deleteTryOn(id: String): AppResult<Unit> = withContext(ioDispatcher) {
        try {
            val response = tryOnApi.deleteTryOn(id)
            if (response.isSuccessful || response.code() == 404) {
                tryOnDao.deleteByPublicId(id)
                AppResult.Success(Unit)
            } else {
                AppResult.Error(NetworkErrorMapper.mapHttpCode(response.code(), null, null))
            }
        } catch (t: Throwable) {
            AppResult.Error(NetworkErrorMapper.map(t))
        }
    }

    override suspend fun getActiveJob(): TryOnJob? = withContext(ioDispatcher) {
        val active = tryOnDao.getLatestActive()
        active?.toDomain()
    }

    override suspend fun clearActiveJob() = withContext(ioDispatcher) {
        val active = tryOnDao.getLatestActive()
        if (active != null) {
            tryOnDao.deleteByPublicId(active.publicId)
        }
    }
}
