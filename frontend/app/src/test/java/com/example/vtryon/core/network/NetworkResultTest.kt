package com.example.vtryon.core.network

import com.example.vtryon.core.common.error.AppError
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class NetworkResultTest {

    @Test
    fun `Success returns true for isSuccess and data matches`() {
        val result: NetworkResult<String> = NetworkResult.Success("data_payload")
        assertTrue(result.isSuccess())
        assertFalse(result.isError())
        assertEquals("data_payload", result.getOrNull())

        var callbackExecuted = false
        result.onSuccess { data ->
            callbackExecuted = true
            assertEquals("data_payload", data)
        }
        assertTrue(callbackExecuted)
    }

    @Test
    fun `Error returns true for isError and null data`() {
        val appError: AppError = AppError.NetworkUnavailable
        val result: NetworkResult<String> = NetworkResult.Error(appError)

        assertFalse(result.isSuccess())
        assertTrue(result.isError())
        assertNull(result.getOrNull())

        var errorCallbackExecuted = false
        result.onError { err ->
            errorCallbackExecuted = true
            assertEquals(appError, err)
        }
        assertTrue(errorCallbackExecuted)
    }
}
