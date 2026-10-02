package com.example.vtryon.feature.outfits

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.domain.model.Outfit
import com.example.vtryon.domain.model.OutfitCategory
import com.example.vtryon.domain.usecase.outfit.ObserveOutfitsUseCase
import com.example.vtryon.domain.usecase.outfit.RefreshOutfitsUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class OutfitsViewModel(
    private val observeOutfitsUseCase: ObserveOutfitsUseCase,
    private val refreshOutfitsUseCase: RefreshOutfitsUseCase
) : ViewModel() {

    private val allOutfits = MutableStateFlow<List<Outfit>>(emptyList())
    private val selectedCategory = MutableStateFlow<OutfitCategory?>(null)
    private val searchQuery = MutableStateFlow("")
    private val sortOrder = MutableStateFlow(OutfitSortOrder.FEATURED)
    private val isLoading = MutableStateFlow(true)
    private val error = MutableStateFlow<AppError?>(null)

    private data class FilterParams(
        val category: OutfitCategory?,
        val query: String,
        val sort: OutfitSortOrder
    )

    private val filterParams = combine(selectedCategory, searchQuery, sortOrder) { cat, query, sort ->
        FilterParams(cat, query, sort)
    }

    val uiState: StateFlow<OutfitsUiState> = combine(
        allOutfits,
        filterParams,
        isLoading,
        error
    ) { rawOutfits, filters, loading, err ->
        val trimmedQuery = filters.query.trim()
        val filtered = rawOutfits.filter { outfit ->
            val matchesCategory = filters.category == null || outfit.category == filters.category
            val matchesSearch = trimmedQuery.isBlank() ||
                outfit.name.contains(trimmedQuery, ignoreCase = true) ||
                (outfit.description?.contains(trimmedQuery, ignoreCase = true) == true) ||
                outfit.category.displayName.contains(trimmedQuery, ignoreCase = true) ||
                outfit.tags.any { it.contains(trimmedQuery, ignoreCase = true) }

            matchesCategory && matchesSearch
        }.let { list ->
            when (filters.sort) {
                OutfitSortOrder.FEATURED -> list
                OutfitSortOrder.NAME_ASC -> list.sortedBy { it.name.lowercase() }
                OutfitSortOrder.NAME_DESC -> list.sortedByDescending { it.name.lowercase() }
            }
        }

        OutfitsUiState(
            outfits = filtered,
            totalCount = rawOutfits.size,
            selectedCategory = filters.category,
            searchQuery = filters.query,
            sortOrder = filters.sort,
            isLoading = loading,
            error = err
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = OutfitsUiState(isLoading = true)
    )

    init {
        observeOutfits()
        refresh()
    }

    private fun observeOutfits() {
        viewModelScope.launch {
            observeOutfitsUseCase(null).collect { outfits ->
                allOutfits.value = outfits
                isLoading.value = false
            }
        }
    }

    fun onEvent(event: OutfitsUiEvent) {
        when (event) {
            is OutfitsUiEvent.CategorySelected -> {
                selectedCategory.value = event.category
            }
            is OutfitsUiEvent.SearchQueryChanged -> {
                searchQuery.value = event.query
            }
            is OutfitsUiEvent.SortOrderChanged -> {
                sortOrder.value = event.sortOrder
            }
            is OutfitsUiEvent.ClearFilters -> {
                selectedCategory.value = null
                searchQuery.value = ""
                sortOrder.value = OutfitSortOrder.FEATURED
            }
            is OutfitsUiEvent.RefreshClicked -> refresh()
            is OutfitsUiEvent.OutfitClicked -> {
                // Handled in fragment navigation
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            isLoading.value = true
            error.value = null
            when (val result = refreshOutfitsUseCase()) {
                is AppResult.Success -> isLoading.value = false
                is AppResult.Error -> {
                    isLoading.value = false
                    error.value = result.error
                }
            }
        }
    }
}
