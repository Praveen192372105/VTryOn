package com.example.vtryon.feature.saved

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.vtryon.domain.usecase.tryon.DeleteTryOnUseCase
import com.example.vtryon.domain.usecase.tryon.GetTryOnHistoryUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class SavedViewModel(
    private val getTryOnHistoryUseCase: GetTryOnHistoryUseCase,
    private val deleteTryOnUseCase: DeleteTryOnUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(SavedUiState(isLoading = true))
    val uiState: StateFlow<SavedUiState> = _uiState.asStateFlow()

    init {
        observeHistory()
        refresh()
    }

    private fun observeHistory() {
        viewModelScope.launch {
            getTryOnHistoryUseCase().collect { history ->
                _uiState.update { it.copy(history = history, isLoading = false) }
            }
        }
    }

    fun onEvent(event: SavedUiEvent) {
        when (event) {
            is SavedUiEvent.DeleteJob -> {
                viewModelScope.launch {
                    deleteTryOnUseCase(event.id)
                }
            }
            is SavedUiEvent.Refresh -> refresh()
        }
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            getTryOnHistoryUseCase.refresh()
            _uiState.update { it.copy(isLoading = false) }
        }
    }
}
