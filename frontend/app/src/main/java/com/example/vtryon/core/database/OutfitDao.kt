package com.example.vtryon.core.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface OutfitDao {

    @Query("SELECT * FROM outfits WHERE isActive = 1 ORDER BY sortOrder ASC")
    fun getActiveOutfits(): Flow<List<OutfitEntity>>

    @Query("SELECT * FROM outfits WHERE isActive = 1 AND category = :category ORDER BY sortOrder ASC")
    fun getOutfitsByCategory(category: String): Flow<List<OutfitEntity>>

    @Query("SELECT * FROM outfits WHERE publicId = :publicId LIMIT 1")
    suspend fun getOutfitByPublicId(publicId: String): OutfitEntity?

    @Query("SELECT * FROM outfits WHERE isFavorited = 1 AND isActive = 1 ORDER BY cachedAt DESC")
    fun getFavoriteOutfits(): Flow<List<OutfitEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOutfits(outfits: List<OutfitEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(outfit: OutfitEntity)

    @Query("SELECT * FROM outfits WHERE publicId = :publicId LIMIT 1")
    suspend fun getByPublicId(publicId: String): OutfitEntity?

    fun observeAll(): Flow<List<OutfitEntity>> = getActiveOutfits()

    fun observeByCategory(category: String): Flow<List<OutfitEntity>> = getOutfitsByCategory(category)

    @androidx.room.Transaction
    suspend fun replaceAll(outfits: List<OutfitEntity>) {
        clearAll()
        insertOutfits(outfits)
    }

    @Query("UPDATE outfits SET isFavorited = :isFavorited WHERE publicId = :publicId")
    suspend fun updateFavoriteStatus(publicId: String, isFavorited: Boolean)

    @Query("DELETE FROM outfits")
    suspend fun clearAll()
}
