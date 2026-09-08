package com.example.vtryon.data.remote.auth

import com.example.vtryon.data.remote.auth.dto.LoginRequestDto
import com.example.vtryon.data.remote.auth.dto.RegisterRequestDto
import com.example.vtryon.data.remote.auth.dto.TokenResponseDto
import com.example.vtryon.data.remote.dto.ApiResponseDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApi {

    @POST("api/v1/auth/login")
    suspend fun login(
        @Body request: LoginRequestDto
    ): Response<ApiResponseDto<TokenResponseDto>>

    @POST("api/v1/auth/register")
    suspend fun register(
        @Body request: RegisterRequestDto
    ): Response<ApiResponseDto<TokenResponseDto>>

    @POST("api/v1/auth/logout")
    suspend fun logout(): Response<ApiResponseDto<Unit>>
}
