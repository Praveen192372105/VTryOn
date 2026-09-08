package com.example.vtryon.feature.outfits

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.domain.model.OutfitCategory
import com.example.vtryon.domain.usecase.outfit.ObserveOutfitsUseCase
import com.example.vtryon.domain.usecase.outfit.RefreshOutfitsUseCase
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class OutfitsViewModel(
    private val observeOutfitsUseCase: ObserveOutfitsUseCase,
    private val refreshOutfitsUseCase: RefreshOutfitsUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(OutfitsUiState(isLoading = true))
    val uiState: StateFlow<OutfitsUiState> = _uiState.asStateFlow()

    private var observeJob: Job? = null

    init {
        observeCategory(null)
        refresh()
    }

    fun onEvent(event: OutfitsUiEvent) {
        when (event) {
            is OutfitsUiEvent.CategorySelected -> {
                _uiState.update { it.copy(selectedCategory = event.category) }
                observeCategory(event.category)
            }
            is OutfitsUiEvent.RefreshClicked -> refresh()
            is OutfitsUiEvent.OutfitClicked -> {
                // Feature handling for selection
            }
        }
    }

    private fun observeCategory(category: OutfitCategory?) {
        observeJob?.cancel()
        observeJob = viewModelScope.launch {
            observeOutfitsUseCase(category).collect { outfits ->
                _uiState.update { it.copy(outfits = outfits, isLoading = false) }
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            when (val result = refreshOutfitsUseCase()) {
                is AppResult.Success -> _uiState.update { it.copy(isLoading = false) }
                is AppResult.Error -> _uiState.update { it.copy(isLoading = false, error = result.error) }
            }
        }
    }
}
