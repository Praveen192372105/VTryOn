package com.example.vtryon.domain.usecase.outfit

import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.domain.repository.OutfitRepository

class RefreshOutfitsUseCase(private val outfitRepository: OutfitRepository) {

    suspend operator fun invoke(): AppResult<Unit> {
        return outfitRepository.refreshOutfits()
    }
}
