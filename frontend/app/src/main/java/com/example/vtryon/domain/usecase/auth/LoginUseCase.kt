package com.example.vtryon.domain.usecase.auth

import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.domain.model.User
import com.example.vtryon.domain.repository.AuthRepository

class LoginUseCase(private val authRepository: AuthRepository) {

    suspend operator fun invoke(email: String, password: String): AppResult<User> {
        val trimmedEmail = email.trim()
        if (trimmedEmail.isBlank() || !trimmedEmail.contains("@")) {
            return AppResult.Error(AppError.Unauthorized)
        }
        if (password.isBlank()) {
            return AppResult.Error(AppError.Unauthorized)
        }
        return authRepository.login(trimmedEmail, password)
    }
}
