package com.example.vtryon.feature.settings

data class SettingsUiState(
    val userEmail: String = "",
    val userName: String = "",
    val isDarkMode: Boolean = false,
    val isOfflineCacheEnabled: Boolean = true
)

sealed interface SettingsUiEvent {
    data class DarkModeToggled(val enabled: Boolean) : SettingsUiEvent
    data class OfflineCacheToggled(val enabled: Boolean) : SettingsUiEvent
    data object SignOutClicked : SettingsUiEvent
}

sealed interface SettingsUiEffect {
    data object NavigateToAuth : SettingsUiEffect
}
