package com.example.vtryon.feature.auth

import com.example.vtryon.core.common.error.AppError

data class LoginUiState(
    val email: String = "user@example.com",
    val password: String = "password123",
    val isLoading: Boolean = false,
    val error: AppError? = null
)

sealed interface LoginUiEvent {
    data class EmailChanged(val value: String) : LoginUiEvent
    data class PasswordChanged(val value: String) : LoginUiEvent
    data object LoginClicked : LoginUiEvent
}

sealed interface LoginUiEffect {
    data object NavigateToWorkspace : LoginUiEffect
    data class ShowToast(val message: String) : LoginUiEffect
}
