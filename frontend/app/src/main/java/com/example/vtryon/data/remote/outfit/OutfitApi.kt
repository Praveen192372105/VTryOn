package com.example.vtryon.data.remote.outfit

import com.example.vtryon.data.remote.dto.ApiResponseDto
import com.example.vtryon.data.remote.dto.PaginatedDataDto
import com.example.vtryon.data.remote.outfit.dto.CreateCustomOutfitResponseDto
import com.example.vtryon.data.remote.outfit.dto.OutfitDto
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Query

interface OutfitApi {

    @GET("api/v1/outfits")
    suspend fun getOutfits(
        @Query("category") category: String? = null
    ): Response<ApiResponseDto<PaginatedDataDto<OutfitDto>>>

    @GET("api/v1/outfits/{id}")
    suspend fun getOutfit(
        @Path("id") id: String
    ): Response<ApiResponseDto<OutfitDto>>

    @Multipart
    @POST("api/v1/outfits")
    suspend fun createCustomOutfit(
        @Part file: MultipartBody.Part,
        @Part("name") name: RequestBody,
        @Part("category") category: RequestBody
    ): Response<ApiResponseDto<CreateCustomOutfitResponseDto>>
}
