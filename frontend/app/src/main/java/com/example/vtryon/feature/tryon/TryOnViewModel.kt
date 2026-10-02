package com.example.vtryon.feature.tryon

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.core.image.ImageCompressor
import com.example.vtryon.domain.model.Outfit
import com.example.vtryon.domain.model.OutfitCategory
import com.example.vtryon.domain.usecase.outfit.ObserveOutfitsUseCase
import com.example.vtryon.domain.usecase.outfit.RefreshOutfitsUseCase
import com.example.vtryon.domain.usecase.tryon.CreateTryOnUseCase
import com.example.vtryon.domain.usecase.tryon.ObserveTryOnUseCase
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class TryOnViewModel(
    private val createTryOnUseCase: CreateTryOnUseCase,
    private val observeTryOnUseCase: ObserveTryOnUseCase,
    private val observeOutfitsUseCase: ObserveOutfitsUseCase,
    private val refreshOutfitsUseCase: RefreshOutfitsUseCase,
    private val imageCompressor: ImageCompressor
) : ViewModel() {

    private val _uiState = MutableStateFlow(TryOnUiState())
    val uiState: StateFlow<TryOnUiState> = _uiState.asStateFlow()

    private val _effect = Channel<TryOnUiEffect>(Channel.BUFFERED)
    val effect = _effect.receiveAsFlow()

    private var targetOutfitId: String? = null

    init {
        viewModelScope.launch {
            observeOutfitsUseCase().collect { outfits ->
                _uiState.update { current ->
                    val chosenOutfit = if (!targetOutfitId.isNullOrBlank()) {
                        outfits.find { it.id == targetOutfitId } ?: current.selectedOutfit ?: outfits.firstOrNull()
                    } else {
                        current.selectedOutfit ?: outfits.firstOrNull()
                    }
                    current.copy(
                        availableOutfits = outfits,
                        selectedOutfit = chosenOutfit,
                        category = chosenOutfit?.category ?: current.category
                    )
                }
            }
        }
        viewModelScope.launch {
            refreshOutfitsUseCase()
        }
    }

    fun onEvent(event: TryOnUiEvent) {
        when (event) {
            is TryOnUiEvent.PersonPhotoPicked -> _uiState.update { it.copy(personImageUri = event.uri, error = null) }
            is TryOnUiEvent.OutfitSelected -> {
                targetOutfitId = event.outfit.id
                _uiState.update { it.copy(selectedOutfit = event.outfit, category = event.outfit.category, error = null) }
            }
            is TryOnUiEvent.CategorySelected -> {
                val matchingOutfit = _uiState.value.availableOutfits.find { it.category == event.category }
                _uiState.update { current ->
                    current.copy(
                        category = event.category,
                        selectedOutfit = matchingOutfit ?: current.selectedOutfit
                    )
                }
            }
            is TryOnUiEvent.PreselectOutfitId -> {
                targetOutfitId = event.outfitId
                timber.log.Timber.d("PreselectOutfitId: targetOutfitId set to ${event.outfitId}")
                val found = _uiState.value.availableOutfits.find { it.id.equals(event.outfitId, ignoreCase = true) }
                if (found != null) {
                    timber.log.Timber.d("PreselectOutfitId: matched outfit: ${found.name}")
                    _uiState.update { it.copy(selectedOutfit = found, category = found.category, error = null) }
                }
            }
            is TryOnUiEvent.PickPhotoClicked -> viewModelScope.launch { _effect.send(TryOnUiEffect.LaunchPhotoPicker) }
            is TryOnUiEvent.GenerateClicked -> executeTryOn()
            is TryOnUiEvent.RetryClicked -> executeTryOn()
        }
    }

    private fun executeTryOn() {
        val state = _uiState.value
        timber.log.Timber.d("executeTryOn: isSubmitting=${state.isSubmitting}, isPolling=${state.isPolling}, photoUri=${state.personImageUri}, outfit=${state.selectedOutfit?.id}")

        // 1. Double-tap and duplicate submission protection
        if (state.isSubmitting || state.isPolling) return

        val imageUri = state.personImageUri
        if (imageUri == null) {
            _uiState.update { it.copy(error = AppError.InvalidImage) }
            viewModelScope.launch { _effect.send(TryOnUiEffect.ShowToast("Please select a person photo first.")) }
            return
        }

        val outfit = state.selectedOutfit
        if (outfit == null) {
            _uiState.update { it.copy(error = AppError.OutfitNotFound) }
            viewModelScope.launch { _effect.send(TryOnUiEffect.ShowToast("Please select a garment outfit first.")) }
            return
        }

        _uiState.update { it.copy(isSubmitting = true, error = null) }

        viewModelScope.launch {
            // 2. Off-main-thread image compression and EXIF rotation normalization
            timber.log.Timber.d("executeTryOn: compressing $imageUri...")
            val compressionResult = imageCompressor.compressForUpload(imageUri)
            val compressedFile = when (compressionResult) {
                is AppResult.Success -> compressionResult.data
                is AppResult.Error -> {
                    timber.log.Timber.e("executeTryOn: compression failed: ${compressionResult.error}")
                    _uiState.update { it.copy(isSubmitting = false, error = compressionResult.error) }
                    _effect.send(TryOnUiEffect.ShowToast("Image compression failed. Please try another photo."))
                    return@launch
                }
            }

            // 3. Submit async job to FastAPI + Celery backend
            timber.log.Timber.d("executeTryOn: submitting try-on for outfit ${outfit.id} with compressed photo ${compressedFile.length()} bytes...")
            val submitResult = createTryOnUseCase(
                personImageFile = compressedFile,
                garmentId = outfit.id,
                customGarmentFile = null,
                category = state.category
            )

            when (submitResult) {
                is AppResult.Success -> {
                    val job = submitResult.data
                    timber.log.Timber.d("executeTryOn: submission SUCCESS! Job ID: ${job.id}")
                    _uiState.update { it.copy(activeJob = job, isSubmitting = false, isPolling = false) }
                    _effect.send(TryOnUiEffect.NavigateToProcessing(job.id))
                }
                is AppResult.Error -> {
                    timber.log.Timber.e("executeTryOn: submission FAILED: ${submitResult.error}")
                    _uiState.update { it.copy(isSubmitting = false, error = submitResult.error) }
                    _effect.send(TryOnUiEffect.ShowToast("Unable to start virtual fitting. Please try again."))
                }
            }
        }
    }
}
