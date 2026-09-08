package com.example.vtryon.feature.saved

import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.domain.model.TryOnJob

data class SavedUiState(
    val history: List<TryOnJob> = emptyList(),
    val isLoading: Boolean = false,
    val error: AppError? = null
)

sealed interface SavedUiEvent {
    data class DeleteJob(val id: String) : SavedUiEvent
    data object Refresh : SavedUiEvent
}
