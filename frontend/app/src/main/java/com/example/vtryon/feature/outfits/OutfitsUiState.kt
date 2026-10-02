package com.example.vtryon.feature.outfits

import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.domain.model.Outfit
import com.example.vtryon.domain.model.OutfitCategory

enum class OutfitSortOrder(val displayName: String) {
    FEATURED("Featured"),
    NAME_ASC("Name (A–Z)"),
    NAME_DESC("Name (Z–A)")
}

data class OutfitsUiState(
    val outfits: List<Outfit> = emptyList(),
    val totalCount: Int = 0,
    val selectedCategory: OutfitCategory? = null,
    val searchQuery: String = "",
    val sortOrder: OutfitSortOrder = OutfitSortOrder.FEATURED,
    val isLoading: Boolean = false,
    val error: AppError? = null
) {
    val activeFiltersCount: Int
        get() = (if (selectedCategory != null) 1 else 0) + (if (sortOrder != OutfitSortOrder.FEATURED) 1 else 0)

    val isFilterActive: Boolean
        get() = activeFiltersCount > 0 || searchQuery.isNotBlank()
}

sealed interface OutfitsUiEvent {
    data class CategorySelected(val category: OutfitCategory?) : OutfitsUiEvent
    data class SearchQueryChanged(val query: String) : OutfitsUiEvent
    data class SortOrderChanged(val sortOrder: OutfitSortOrder) : OutfitsUiEvent
    data object ClearFilters : OutfitsUiEvent
    data class OutfitClicked(val outfit: Outfit) : OutfitsUiEvent
    data object RefreshClicked : OutfitsUiEvent
}
