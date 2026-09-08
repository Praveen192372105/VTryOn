package com.example.vtryon.core.network

import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.core.common.result.AppResult

/**
 * Type-safe representation of remote network operation results.
 */
sealed interface NetworkResult<out T> {
    data class Success<out T>(val data: T) : NetworkResult<T>
    data class Error(val error: AppError) : NetworkResult<Nothing>

    fun isSuccess(): Boolean = this is Success
    fun isError(): Boolean = this is Error

    fun getOrNull(): T? = (this as? Success)?.data

    fun toAppResult(): AppResult<T> = when (this) {
        is Success -> AppResult.Success(data)
        is Error -> AppResult.Error(error)
    }
}

inline fun <T> NetworkResult<T>.onSuccess(action: (T) -> Unit): NetworkResult<T> {
    if (this is NetworkResult.Success) action(data)
    return this
}

inline fun <T> NetworkResult<T>.onError(action: (AppError) -> Unit): NetworkResult<T> {
    if (this is NetworkResult.Error) action(error)
    return this
}
