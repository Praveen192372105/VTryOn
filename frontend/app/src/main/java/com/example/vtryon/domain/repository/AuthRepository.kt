package com.example.vtryon.domain.repository

import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.domain.model.User
import kotlinx.coroutines.flow.Flow

/**
 * Domain boundary contract for user authentication and session lifecycle.
 */
interface AuthRepository {

    suspend fun login(email: String, password: String): AppResult<User>

    suspend fun register(name: String, email: String, password: String): AppResult<User>

    suspend fun logout(): AppResult<Unit>

    suspend fun getCurrentUser(): AppResult<User>

    fun observeSession(): Flow<User?>

    fun hasActiveSession(): Boolean
}
