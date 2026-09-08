package com.example.vtryon.data.repository

import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.core.network.NetworkErrorMapper
import com.example.vtryon.core.security.TokenStorage
import com.example.vtryon.data.mapper.toDomain
import com.example.vtryon.data.remote.auth.AuthApi
import com.example.vtryon.data.remote.auth.dto.LoginRequestDto
import com.example.vtryon.data.remote.auth.dto.RegisterRequestDto
import com.example.vtryon.domain.model.User
import com.example.vtryon.domain.repository.AuthRepository
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext

class AuthRepositoryImpl(
    private val authApi: AuthApi,
    private val tokenStorage: TokenStorage,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) : AuthRepository {

    private val _sessionUser = MutableStateFlow<User?>(
        if (tokenStorage.hasSession()) {
            User(
                id = tokenStorage.getUserPublicId() ?: "",
                email = tokenStorage.getUserEmail() ?: "",
                name = tokenStorage.getUserName() ?: ""
            )
        } else null
    )

    override fun observeSession(): Flow<User?> = _sessionUser.asStateFlow()

    override fun hasActiveSession(): Boolean = tokenStorage.hasSession()

    override suspend fun login(email: String, password: String): AppResult<User> = withContext(ioDispatcher) {
        try {
            val response = authApi.login(LoginRequestDto(email = email, password = password))
            if (response.isSuccessful) {
                val tokenResponse = response.body()?.data
                    ?: return@withContext AppResult.Error(AppError.ServerUnavailable)

                tokenStorage.saveTokens(
                    accessToken = tokenResponse.accessToken,
                    refreshToken = tokenResponse.refreshToken,
                    userPublicId = tokenResponse.user.publicId,
                    userEmail = tokenResponse.user.email,
                    userName = tokenResponse.user.name
                )
                val user = tokenResponse.toDomain()
                _sessionUser.value = user
                AppResult.Success(user)
            } else {
                AppResult.Error(NetworkErrorMapper.mapHttpCode(response.code(), null, null))
            }
        } catch (t: Throwable) {
            AppResult.Error(NetworkErrorMapper.map(t))
        }
    }

    override suspend fun register(name: String, email: String, password: String): AppResult<User> = withContext(ioDispatcher) {
        try {
            val response = authApi.register(RegisterRequestDto(name = name, email = email, password = password))
            if (response.isSuccessful) {
                val tokenResponse = response.body()?.data
                    ?: return@withContext AppResult.Error(AppError.ServerUnavailable)

                tokenStorage.saveTokens(
                    accessToken = tokenResponse.accessToken,
                    refreshToken = tokenResponse.refreshToken,
                    userPublicId = tokenResponse.user.publicId,
                    userEmail = tokenResponse.user.email,
                    userName = tokenResponse.user.name
                )
                val user = tokenResponse.toDomain()
                _sessionUser.value = user
                AppResult.Success(user)
            } else {
                AppResult.Error(NetworkErrorMapper.mapHttpCode(response.code(), null, null))
            }
        } catch (t: Throwable) {
            AppResult.Error(NetworkErrorMapper.map(t))
        }
    }

    override suspend fun logout(): AppResult<Unit> = withContext(ioDispatcher) {
        try {
            authApi.logout()
        } catch (_: Exception) {
            // Best effort remote revocation
        } finally {
            tokenStorage.clearSession()
            _sessionUser.value = null
        }
        AppResult.Success(Unit)
    }
}
