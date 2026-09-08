package com.example.vtryon.feature.tryon

import android.net.Uri
import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.domain.model.Outfit
import com.example.vtryon.domain.model.OutfitCategory
import com.example.vtryon.domain.model.TryOnJob

data class TryOnUiState(
    val personImageUri: Uri? = null,
    val selectedOutfit: Outfit? = null,
    val category: OutfitCategory = OutfitCategory.UPPER_BODY,
    val activeJob: TryOnJob? = null,
    val isSubmitting: Boolean = false,
    val isPolling: Boolean = false,
    val error: AppError? = null
)

sealed interface TryOnUiEvent {
    data class PersonPhotoPicked(val uri: Uri) : TryOnUiEvent
    data class OutfitSelected(val outfit: Outfit) : TryOnUiEvent
    data class CategorySelected(val category: OutfitCategory) : TryOnUiEvent
    data object PickPhotoClicked : TryOnUiEvent
    data object GenerateClicked : TryOnUiEvent
    data object RetryClicked : TryOnUiEvent
}

sealed interface TryOnUiEffect {
    data class NavigateToProcessing(val jobId: String) : TryOnUiEffect
    data class NavigateToResult(val jobId: String) : TryOnUiEffect
    data object LaunchPhotoPicker : TryOnUiEffect
    data class ShowToast(val message: String) : TryOnUiEffect
}
