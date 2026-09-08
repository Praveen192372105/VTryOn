package com.example.vtryon.domain.usecase.tryon

import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.domain.model.TryOnJob
import com.example.vtryon.domain.repository.TryOnRepository
import kotlinx.coroutines.flow.Flow

class ObserveTryOnUseCase(private val tryOnRepository: TryOnRepository) {

    operator fun invoke(id: String): Flow<TryOnJob?> {
        return tryOnRepository.observeTryOn(id)
    }

    suspend fun poll(id: String): AppResult<TryOnJob> {
        return tryOnRepository.pollTryOnStatus(id)
    }
}
