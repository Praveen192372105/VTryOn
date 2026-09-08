package com.example.vtryon.feature.home

import com.example.vtryon.domain.model.Outfit
import com.example.vtryon.domain.model.TryOnJob
import com.example.vtryon.domain.model.User

data class HomeUiState(
    val user: User? = null,
    val activeJob: TryOnJob? = null,
    val recentOutfits: List<Outfit> = emptyList(),
    val isLoading: Boolean = false
)

sealed interface HomeUiEvent {
    data object StartTryOnClicked : HomeUiEvent
    data object ViewOutfitsClicked : HomeUiEvent
    data object RefreshClicked : HomeUiEvent
}
