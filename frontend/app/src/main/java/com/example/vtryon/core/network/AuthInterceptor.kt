package com.example.vtryon.core.network

import com.example.vtryon.core.security.TokenStorage
import okhttp3.Interceptor
import okhttp3.Response

/**
 * Attaches Bearer authentication token to outgoing requests and intercepts 401 Unauthorized.
 * Sanitizes headers to prevent JWT leaks in application logs.
 */
class AuthInterceptor(
    private val tokenStorage: TokenStorage,
    private val onSessionExpired: (() -> Unit)? = null
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        val token = tokenStorage.getAccessToken()
        val request = if (!token.isNullOrBlank() && !originalRequest.headers.names().contains("Authorization")) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            originalRequest
        }

        val response = chain.proceed(request)

        if (response.code == 401 && !token.isNullOrBlank()) {
            tokenStorage.clearTokens()
            onSessionExpired?.invoke()
        }

        return response
    }
}
