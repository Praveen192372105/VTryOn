package com.example.vtryon.feature.result

import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.domain.model.TryOnJob

data class ResultUiState(
    val job: TryOnJob? = null,
    val isLoading: Boolean = false,
    val error: AppError? = null
)

sealed interface ResultUiEvent {
    data class LoadResult(val jobId: String) : ResultUiEvent
    data object RetryClicked : ResultUiEvent
}
