package com.example.vtryon.feature.settings

import com.example.vtryon.domain.model.TryOnJob

data class SettingsUiState(
    val userEmail: String = "",
    val userName: String = "",
    val history: List<TryOnJob> = emptyList(),
    val isHistoryLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val isDarkMode: Boolean = false,
    val isOfflineCacheEnabled: Boolean = true
) {
    val totalFittings: Int get() = history.size
    val savedCount: Int get() = history.count { it.isSaved }
    val userInitial: String
        get() = userName.trim().firstOrNull()?.uppercase() ?: "V"
}

sealed interface SettingsUiEvent {
    data class DarkModeToggled(val enabled: Boolean) : SettingsUiEvent
    data class OfflineCacheToggled(val enabled: Boolean) : SettingsUiEvent
    data object SignOutClicked : SettingsUiEvent
    data object RefreshHistory : SettingsUiEvent
    data class DeleteJob(val id: String) : SettingsUiEvent
    data class ToggleSave(val id: String, val isSaved: Boolean) : SettingsUiEvent
}

sealed interface SettingsUiEffect {
    data object NavigateToAuth : SettingsUiEffect
    data class ShowToast(val message: String) : SettingsUiEffect
}
