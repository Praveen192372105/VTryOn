package com.example.vtryon.domain.usecase.tryon

import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.domain.model.OutfitCategory
import com.example.vtryon.domain.model.TryOnJob
import com.example.vtryon.domain.repository.TryOnRepository
import java.io.File

class CreateTryOnUseCase(private val tryOnRepository: TryOnRepository) {

    suspend operator fun invoke(
        personImageFile: File,
        garmentId: String?,
        customGarmentFile: File?,
        category: OutfitCategory
    ): AppResult<TryOnJob> {
        if (!personImageFile.exists() || personImageFile.length() <= 0) {
            return AppResult.Error(AppError.InvalidImage)
        }
        if (garmentId.isNullOrBlank() && (customGarmentFile == null || !customGarmentFile.exists())) {
            return AppResult.Error(AppError.OutfitNotFound)
        }
        return tryOnRepository.createTryOn(
            personImageFile = personImageFile,
            garmentId = garmentId,
            customGarmentFile = customGarmentFile,
            category = category
        )
    }
}
