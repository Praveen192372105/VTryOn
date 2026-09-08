package com.example.vtryon.feature.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.vtryon.core.datastore.AppSettingsStore
import com.example.vtryon.domain.repository.AuthRepository
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val authRepository: AuthRepository,
    private val settingsStore: AppSettingsStore
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    private val _effect = Channel<SettingsUiEffect>(Channel.BUFFERED)
    val effect = _effect.receiveAsFlow()

    init {
        observeSettings()
    }

    private fun observeSettings() {
        viewModelScope.launch {
            authRepository.observeSession().collect { user ->
                if (user != null) {
                    _uiState.update { it.copy(userEmail = user.email, userName = user.name) }
                }
            }
        }
        viewModelScope.launch {
            settingsStore.themeMode.collect { mode ->
                _uiState.update { it.copy(isDarkMode = mode == AppSettingsStore.ThemeMode.DARK) }
            }
        }
    }

    fun onEvent(event: SettingsUiEvent) {
        when (event) {
            is SettingsUiEvent.DarkModeToggled -> {
                viewModelScope.launch {
                    settingsStore.setThemeMode(
                        if (event.enabled) AppSettingsStore.ThemeMode.DARK else AppSettingsStore.ThemeMode.LIGHT
                    )
                }
            }
            is SettingsUiEvent.OfflineCacheToggled -> {
                _uiState.update { it.copy(isOfflineCacheEnabled = event.enabled) }
            }
            is SettingsUiEvent.SignOutClicked -> {
                viewModelScope.launch {
                    authRepository.logout()
                    _effect.send(SettingsUiEffect.NavigateToAuth)
                }
            }
        }
    }
}
