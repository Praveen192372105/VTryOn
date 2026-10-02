package com.example.vtryon.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.vtryon.domain.usecase.auth.ObserveSessionUseCase
import com.example.vtryon.domain.usecase.outfit.ObserveOutfitsUseCase
import com.example.vtryon.domain.usecase.outfit.RefreshOutfitsUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class HomeViewModel(
    private val observeSessionUseCase: ObserveSessionUseCase,
    private val observeOutfitsUseCase: ObserveOutfitsUseCase,
    private val refreshOutfitsUseCase: RefreshOutfitsUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState(isLoading = true))
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        observeData()
        refreshCatalogue()
    }

    private fun observeData() {
        viewModelScope.launch {
            observeSessionUseCase().collect { user ->
                _uiState.update { it.copy(user = user) }
            }
        }

        viewModelScope.launch {
            observeOutfitsUseCase().collect { outfits ->
                _uiState.update { it.copy(recentOutfits = outfits, isLoading = false) }
            }
        }
    }

    fun refreshCatalogue() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            refreshOutfitsUseCase()
            _uiState.update { it.copy(isLoading = false) }
        }
    }
}
