package com.example.vtryon.domain.usecase.tryon

import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.domain.model.TryOnJob
import com.example.vtryon.domain.repository.TryOnRepository
import kotlinx.coroutines.flow.Flow

class GetTryOnHistoryUseCase(private val tryOnRepository: TryOnRepository) {

    operator fun invoke(): Flow<List<TryOnJob>> {
        return tryOnRepository.observeTryOnHistory()
    }

    suspend fun refresh(): AppResult<Unit> {
        return tryOnRepository.refreshTryOnHistory()
    }
}
