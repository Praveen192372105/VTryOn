package com.example.vtryon.feature.result

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.domain.usecase.tryon.ObserveTryOnUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class ResultViewModel(
    private val observeTryOnUseCase: ObserveTryOnUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(ResultUiState(isLoading = true))
    val uiState: StateFlow<ResultUiState> = _uiState.asStateFlow()

    fun load(jobId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            // 1. Observe from Room single source of truth
            observeTryOnUseCase(jobId).collect { job ->
                if (job != null) {
                    _uiState.update { it.copy(job = job, isLoading = false) }
                } else {
                    // 2. Fallback: poll server if process was restored without cache
                    when (val pollResult = observeTryOnUseCase.poll(jobId)) {
                        is AppResult.Success -> _uiState.update { it.copy(job = pollResult.data, isLoading = false) }
                        is AppResult.Error -> _uiState.update { it.copy(isLoading = false, error = pollResult.error) }
                    }
                }
            }
        }
    }
}
