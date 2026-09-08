package com.example.vtryon.data.remote.upload

import com.example.vtryon.data.remote.dto.ApiResponseDto
import com.example.vtryon.data.remote.upload.dto.PersonUploadResponseDto
import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

interface UploadApi {

    @Multipart
    @POST("api/v1/uploads/person")
    suspend fun uploadPersonImage(
        @Part file: MultipartBody.Part
    ): Response<ApiResponseDto<PersonUploadResponseDto>>
}
