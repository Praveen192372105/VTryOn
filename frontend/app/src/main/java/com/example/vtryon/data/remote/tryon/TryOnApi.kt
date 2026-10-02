package com.example.vtryon.data.remote.tryon

import com.example.vtryon.data.remote.dto.ApiResponseDto
import com.example.vtryon.data.remote.dto.PaginatedDataDto
import com.example.vtryon.data.remote.tryon.dto.CreateTryOnRequestDto
import com.example.vtryon.data.remote.tryon.dto.TryOnJobResponseDto
import com.example.vtryon.data.remote.tryon.dto.TryOnListItemDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface TryOnApi {

    @POST("api/v1/try-ons")
    suspend fun createTryOn(
        @Body request: CreateTryOnRequestDto,
        @Header("Idempotency-Key") idempotencyKey: String? = null
    ): Response<ApiResponseDto<TryOnJobResponseDto>>

    @GET("api/v1/try-ons/{id}")
    suspend fun getTryOn(
        @Path("id") id: String
    ): Response<ApiResponseDto<TryOnJobResponseDto>>

    @GET("api/v1/try-ons")
    suspend fun getTryOnHistory(
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0
    ): Response<ApiResponseDto<PaginatedDataDto<TryOnListItemDto>>>

    @DELETE("api/v1/try-ons/{id}")
    suspend fun deleteTryOn(
        @Path("id") id: String
    ): Response<ApiResponseDto<Unit>>
}
