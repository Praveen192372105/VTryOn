package com.example.vtryon.core.network

import com.example.vtryon.core.common.error.AppError
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import retrofit2.HttpException
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

object NetworkErrorMapper {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    fun map(throwable: Throwable): AppError {
        return when (throwable) {
            is SocketTimeoutException -> AppError.Timeout
            is UnknownHostException -> AppError.NetworkUnavailable
            is IOException -> AppError.NetworkUnavailable
            is HttpException -> {
                val errorBody = throwable.response()?.errorBody()?.string()
                val apiError = parseErrorBody(errorBody)
                mapHttpCode(throwable.code(), apiError, throwable)
            }
            else -> AppError.Unknown(cause = throwable)
        }
    }

    fun mapHttpCode(code: Int, apiError: ApiErrorDto?, cause: Throwable?): AppError {
        return when (code) {
            401, 403 -> AppError.Unauthorized
            404 -> AppError.OutfitNotFound
            408 -> AppError.Timeout
            413 -> AppError.ImageTooLarge
            422 -> AppError.InvalidImage
            500, 502, 503, 504 -> AppError.ServerUnavailable
            else -> AppError.Unknown(cause = cause)
        }
    }

    private fun parseErrorBody(body: String?): ApiErrorDto? {
        if (body.isNullOrBlank()) return null
        return try {
            val envelope = json.decodeFromString<ApiResponseEnvelope<Unit>>(body)
            envelope.error
        } catch (_: Exception) {
            null
        }
    }
}
