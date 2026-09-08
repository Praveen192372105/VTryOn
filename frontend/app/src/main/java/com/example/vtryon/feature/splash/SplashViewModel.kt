package com.example.vtryon.feature.splash

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.vtryon.domain.usecase.auth.ObserveSessionUseCase
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch

class SplashViewModel(
    private val observeSessionUseCase: ObserveSessionUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(SplashUiState())
    val uiState: StateFlow<SplashUiState> = _uiState.asStateFlow()

    private val _effect = Channel<SplashUiEffect>(Channel.BUFFERED)
    val effect = _effect.receiveAsFlow()

    init {
        resolveSession()
    }

    private fun resolveSession() {
        viewModelScope.launch {
            // Brief visual branding pause
            delay(800)
            if (observeSessionUseCase.hasActiveSession()) {
                _effect.send(SplashUiEffect.NavigateToWorkspace)
            } else {
                _effect.send(SplashUiEffect.NavigateToAuth)
            }
            _uiState.value = SplashUiState(isResolving = false)
        }
    }
}
