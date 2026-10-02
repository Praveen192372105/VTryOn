package com.example.vtryon.data.remote.user

import com.example.vtryon.data.remote.dto.ApiResponseDto
import com.example.vtryon.data.remote.user.dto.UserProfileDto
import retrofit2.Response
import retrofit2.http.GET

interface UserApi {

    @GET("api/v1/users/me")
    suspend fun getCurrentUser(): Response<ApiResponseDto<UserProfileDto>>
}
