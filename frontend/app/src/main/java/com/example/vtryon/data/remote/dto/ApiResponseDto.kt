package com.example.vtryon.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class ApiResponseDto<T>(
    val success: Boolean = true,
    val data: T? = null,
    val message: String? = null,
    val error: ApiErrorDetailDto? = null
)

@Serializable
data class ApiErrorDetailDto(
    val code: String? = null,
    val message: String? = null,
    val details: String? = null
)
