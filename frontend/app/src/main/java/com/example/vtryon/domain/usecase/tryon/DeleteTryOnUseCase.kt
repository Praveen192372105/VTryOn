package com.example.vtryon.domain.usecase.tryon

import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.domain.repository.TryOnRepository

class DeleteTryOnUseCase(private val tryOnRepository: TryOnRepository) {

    suspend operator fun invoke(id: String): AppResult<Unit> {
        return tryOnRepository.deleteTryOn(id)
    }
}
