package com.example.vtryon.feature.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.core.datastore.AppSettingsStore
import com.example.vtryon.domain.repository.AuthRepository
import com.example.vtryon.domain.repository.TryOnRepository
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val authRepository: AuthRepository,
    private val tryOnRepository: TryOnRepository,
    private val settingsStore: AppSettingsStore
) : ViewModel() {

    private val _uiState = MutableStateFlow(
        SettingsUiState(
            isHistoryLoading = true,
            isDarkMode = androidx.appcompat.app.AppCompatDelegate.getDefaultNightMode() == androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_YES
        )
    )
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    private val _effect = Channel<SettingsUiEffect>(Channel.BUFFERED)
    val effect = _effect.receiveAsFlow()

    init {
        observeSettings()
        loadUserProfile()
        observeHistory()
        refreshHistory()
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
                val isDark = when (mode) {
                    AppSettingsStore.ThemeMode.DARK -> true
                    AppSettingsStore.ThemeMode.LIGHT -> false
                    AppSettingsStore.ThemeMode.SYSTEM -> {
                        val current = androidx.appcompat.app.AppCompatDelegate.getDefaultNightMode()
                        current == androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_YES
                    }
                }
                _uiState.update { it.copy(isDarkMode = isDark) }
            }
        }
    }

    private fun loadUserProfile() {
        viewModelScope.launch {
            authRepository.getCurrentUser()
        }
    }

    private fun observeHistory() {
        viewModelScope.launch {
            tryOnRepository.observeTryOnHistory().collect { jobs ->
                _uiState.update { it.copy(history = jobs, isHistoryLoading = false) }
            }
        }
    }

    fun refreshHistory() {
        viewModelScope.launch {
            _uiState.update { it.copy(isRefreshing = true) }
            tryOnRepository.refreshTryOnHistory()
            _uiState.update { it.copy(isRefreshing = false) }
        }
    }

    private fun deleteJob(id: String) {
        viewModelScope.launch {
            when (val result = tryOnRepository.deleteTryOn(id)) {
                is AppResult.Success -> {
                    _effect.send(SettingsUiEffect.ShowToast("Look deleted successfully"))
                }
                is AppResult.Error -> {
                    _effect.send(SettingsUiEffect.ShowToast("Could not delete look"))
                }
            }
        }
    }

    private fun toggleSave(id: String, isSaved: Boolean) {
        viewModelScope.launch {
            tryOnRepository.toggleSaveTryOn(id, isSaved)
            val msg = if (isSaved) "Look saved to favorites" else "Look removed from saved"
            _effect.send(SettingsUiEffect.ShowToast(msg))
        }
    }

    fun onEvent(event: SettingsUiEvent) {
        when (event) {
            is SettingsUiEvent.DarkModeToggled -> {
                _uiState.update { it.copy(isDarkMode = event.enabled) }
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
            is SettingsUiEvent.RefreshHistory -> refreshHistory()
            is SettingsUiEvent.DeleteJob -> deleteJob(event.id)
            is SettingsUiEvent.ToggleSave -> toggleSave(event.id, event.isSaved)
        }
    }
}
