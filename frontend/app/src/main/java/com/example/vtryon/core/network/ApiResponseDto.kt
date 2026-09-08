package com.example.vtryon.core.network

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class ApiResponseEnvelope<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ApiErrorDto? = null,
    val meta: JsonElement? = null
)

@Serializable
data class ApiErrorDto(
    val code: String? = null,
    val message: String? = null,
    val details: JsonElement? = null
)
