package com.example.vtryon.domain.usecase.outfit

import com.example.vtryon.domain.model.Outfit
import com.example.vtryon.domain.model.OutfitCategory
import com.example.vtryon.domain.repository.OutfitRepository
import kotlinx.coroutines.flow.Flow

class ObserveOutfitsUseCase(private val outfitRepository: OutfitRepository) {

    operator fun invoke(category: OutfitCategory? = null): Flow<List<Outfit>> {
        return outfitRepository.observeOutfits(category)
    }
}
