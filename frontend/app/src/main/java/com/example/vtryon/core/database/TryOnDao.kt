package com.example.vtryon.core.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface TryOnDao {

    @Query("SELECT * FROM try_on_jobs ORDER BY updatedAt DESC")
    fun getAllTryOns(): Flow<List<TryOnEntity>>

    @Query("SELECT * FROM try_on_jobs ORDER BY updatedAt DESC")
    fun observeAll(): Flow<List<TryOnEntity>>

    @Query("SELECT * FROM try_on_jobs WHERE publicId = :publicId LIMIT 1")
    fun observeByPublicId(publicId: String): Flow<TryOnEntity?>

    @Query("SELECT * FROM try_on_jobs WHERE isSavedLocally = 1 ORDER BY updatedAt DESC")
    fun getSavedTryOns(): Flow<List<TryOnEntity>>

    @Query("SELECT * FROM try_on_jobs WHERE publicId = :publicId LIMIT 1")
    suspend fun getTryOnById(publicId: String): TryOnEntity?

    @Query("SELECT * FROM try_on_jobs WHERE status IN ('queued', 'processing') ORDER BY updatedAt DESC LIMIT 1")
    suspend fun getLatestActive(): TryOnEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTryOn(tryOn: TryOnEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(tryOn: TryOnEntity): Long

    @Query("UPDATE try_on_jobs SET status = :status, resultImageUrl = :resultUrl, errorMessage = :errorMsg, updatedAt = :timestamp WHERE publicId = :publicId")
    suspend fun updateStatus(
        publicId: String,
        status: String,
        resultUrl: String?,
        errorMsg: String?,
        timestamp: Long
    ): Int

    @Query("UPDATE try_on_jobs SET isSavedLocally = :isSaved WHERE publicId = :publicId")
    suspend fun updateSavedLocally(publicId: String, isSaved: Boolean): Int

    @Query("DELETE FROM try_on_jobs WHERE publicId = :publicId")
    suspend fun deleteTryOn(publicId: String): Int

    @Query("DELETE FROM try_on_jobs WHERE publicId = :publicId")
    suspend fun deleteByPublicId(publicId: String): Int
}
