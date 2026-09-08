package com.example.vtryon.feature.tryon

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.core.image.ImageCompressor
import com.example.vtryon.domain.model.TryOnStatus
import com.example.vtryon.domain.usecase.tryon.CreateTryOnUseCase
import com.example.vtryon.domain.usecase.tryon.ObserveTryOnUseCase
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class TryOnViewModel(
    private val createTryOnUseCase: CreateTryOnUseCase,
    private val observeTryOnUseCase: ObserveTryOnUseCase,
    private val imageCompressor: ImageCompressor
) : ViewModel() {

    private val _uiState = MutableStateFlow(TryOnUiState())
    val uiState: StateFlow<TryOnUiState> = _uiState.asStateFlow()

    private val _effect = Channel<TryOnUiEffect>(Channel.BUFFERED)
    val effect = _effect.receiveAsFlow()

    private var pollingJob: Job? = null

    fun onEvent(event: TryOnUiEvent) {
        when (event) {
            is TryOnUiEvent.PersonPhotoPicked -> _uiState.update { it.copy(personImageUri = event.uri, error = null) }
            is TryOnUiEvent.OutfitSelected -> _uiState.update { it.copy(selectedOutfit = event.outfit, error = null) }
            is TryOnUiEvent.CategorySelected -> _uiState.update { it.copy(category = event.category) }
            is TryOnUiEvent.PickPhotoClicked -> viewModelScope.launch { _effect.send(TryOnUiEffect.LaunchPhotoPicker) }
            is TryOnUiEvent.GenerateClicked -> executeTryOn()
            is TryOnUiEvent.RetryClicked -> executeTryOn()
        }
    }

    private fun executeTryOn() {
        val state = _uiState.value
        // 1. Double-tap and duplicate submission protection
        if (state.isSubmitting || state.isPolling) return

        val imageUri = state.personImageUri
        if (imageUri == null) {
            _uiState.update { it.copy(error = AppError.InvalidImage) }
            return
        }

        val outfit = state.selectedOutfit
        if (outfit == null) {
            _uiState.update { it.copy(error = AppError.OutfitNotFound) }
            return
        }

        _uiState.update { it.copy(isSubmitting = true, error = null) }

        viewModelScope.launch {
            // 2. Off-main-thread image compression and EXIF rotation normalization
            val compressionResult = imageCompressor.compressForUpload(imageUri)
            val compressedFile = when (compressionResult) {
                is AppResult.Success -> compressionResult.data
                is AppResult.Error -> {
                    _uiState.update { it.copy(isSubmitting = false, error = compressionResult.error) }
                    return@launch
                }
            }

            // 3. Submit async job to FastAPI + Celery backend
            val submitResult = createTryOnUseCase(
                personImageFile = compressedFile,
                garmentId = outfit.id,
                customGarmentFile = null,
                category = state.category
            )

            when (submitResult) {
                is AppResult.Success -> {
                    val job = submitResult.data
                    _uiState.update { it.copy(activeJob = job, isSubmitting = false, isPolling = false) }
                    _effect.send(TryOnUiEffect.NavigateToProcessing(job.id))
                }
                is AppResult.Error -> {
                    _uiState.update { it.copy(isSubmitting = false, error = submitResult.error) }
                }
            }
        }
    }

    private fun startLifecycleAwarePolling(jobId: String) {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (isActive) {
                delay(2500) // Polling interval
                when (val pollResult = observeTryOnUseCase.poll(jobId)) {
                    is AppResult.Success -> {
                        val job = pollResult.data
                        _uiState.update { it.copy(activeJob = job) }

                        if (job.status == TryOnStatus.COMPLETED) {
                            _uiState.update { it.copy(isPolling = false) }
                            _effect.send(TryOnUiEffect.NavigateToResult(job.id))
                            break
                        } else if (job.status == TryOnStatus.FAILED) {
                            _uiState.update { it.copy(isPolling = false, error = AppError.TryOnFailed) }
                            break
                        }
                    }
                    is AppResult.Error -> {
                        // Transient polling error, continue unless cancelled
                    }
                }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        pollingJob?.cancel()
    }
}
