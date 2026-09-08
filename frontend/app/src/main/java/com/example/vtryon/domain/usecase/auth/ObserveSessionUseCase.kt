package com.example.vtryon.domain.usecase.auth

import com.example.vtryon.domain.model.User
import com.example.vtryon.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow

class ObserveSessionUseCase(private val authRepository: AuthRepository) {

    operator fun invoke(): Flow<User?> = authRepository.observeSession()

    fun hasActiveSession(): Boolean = authRepository.hasActiveSession()
}
