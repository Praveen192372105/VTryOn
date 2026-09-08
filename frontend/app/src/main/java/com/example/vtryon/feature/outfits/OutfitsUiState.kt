package com.example.vtryon.feature.outfits

import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.domain.model.Outfit
import com.example.vtryon.domain.model.OutfitCategory

data class OutfitsUiState(
    val outfits: List<Outfit> = emptyList(),
    val selectedCategory: OutfitCategory? = null,
    val isLoading: Boolean = false,
    val error: AppError? = null
)

sealed interface OutfitsUiEvent {
    data class CategorySelected(val category: OutfitCategory?) : OutfitsUiEvent
    data class OutfitClicked(val outfit: Outfit) : OutfitsUiEvent
    data object RefreshClicked : OutfitsUiEvent
}
