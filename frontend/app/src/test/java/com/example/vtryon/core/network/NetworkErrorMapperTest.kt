package com.example.vtryon.core.network

import com.example.vtryon.core.common.error.AppError
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

class NetworkErrorMapperTest {

    @Test
    fun `map UnknownHostException to NetworkUnavailable`() {
        val error = NetworkErrorMapper.map(UnknownHostException("Unable to resolve host"))
        assertTrue(error is AppError.NetworkUnavailable)
    }

    @Test
    fun `map SocketTimeoutException to Timeout`() {
        val error = NetworkErrorMapper.map(SocketTimeoutException("Timeout"))
        assertTrue(error is AppError.Timeout)
    }

    @Test
    fun `map IOException to NetworkUnavailable`() {
        val error = NetworkErrorMapper.map(IOException("Connection reset"))
        assertTrue(error is AppError.NetworkUnavailable)
    }

    @Test
    fun `map HTTP 401 to Unauthorized`() {
        val apiError = ApiErrorDto(code = "INVALID_CREDENTIALS", message = "Incorrect password")
        val error = NetworkErrorMapper.mapHttpCode(401, apiError, null)
        assertTrue(error is AppError.Unauthorized)
    }

    @Test
    fun `map HTTP 404 to OutfitNotFound`() {
        val apiError = ApiErrorDto(code = "OUTFIT_NOT_FOUND", message = "Garment not found")
        val error = NetworkErrorMapper.mapHttpCode(404, apiError, null)
        assertTrue(error is AppError.OutfitNotFound)
    }

    @Test
    fun `map HTTP 413 to ImageTooLarge`() {
        val apiError = ApiErrorDto(code = "FILE_TOO_LARGE", message = "Image is larger than 10MB")
        val error = NetworkErrorMapper.mapHttpCode(413, apiError, null)
        assertTrue(error is AppError.ImageTooLarge)
    }

    @Test
    fun `map HTTP 422 to InvalidImage`() {
        val apiError = ApiErrorDto(code = "INVALID_FORMAT", message = "Unsupported image format")
        val error = NetworkErrorMapper.mapHttpCode(422, apiError, null)
        assertTrue(error is AppError.InvalidImage)
    }

    @Test
    fun `map HTTP 500 to ServerUnavailable`() {
        val error = NetworkErrorMapper.mapHttpCode(500, null, null)
        assertTrue(error is AppError.ServerUnavailable)
    }
}
