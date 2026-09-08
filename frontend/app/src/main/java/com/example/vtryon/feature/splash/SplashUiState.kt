package com.example.vtryon.feature.splash

data class SplashUiState(
    val isResolving: Boolean = true
)

sealed interface SplashUiEffect {
    data object NavigateToAuth : SplashUiEffect
    data object NavigateToWorkspace : SplashUiEffect
}
