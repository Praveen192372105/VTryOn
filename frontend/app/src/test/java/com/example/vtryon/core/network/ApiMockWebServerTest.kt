package com.example.vtryon.core.network

import com.example.vtryon.data.remote.auth.AuthApi
import com.example.vtryon.data.remote.auth.dto.LoginRequestDto
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

class ApiMockWebServerTest {

    private lateinit var mockWebServer: MockWebServer
    private lateinit var authApi: AuthApi

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    @Before
    fun setup() {
        mockWebServer = MockWebServer()
        mockWebServer.start()

        val okHttpClient = OkHttpClient.Builder().build()
        val retrofit = Retrofit.Builder()
            .baseUrl(mockWebServer.url("/"))
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()

        authApi = retrofit.create(AuthApi::class.java)
    }

    @After
    fun tearDown() {
        mockWebServer.shutdown()
    }

    @Test
    fun `login returns 200 OK with valid token response`() = runBlocking {
        val jsonBody = """
            {
                "success": true,
                "data": {
                    "token_type": "bearer",
                    "access_token": "jwt.valid.token",
                    "expires_in": 3600,
                    "user": {
                        "public_id": "usr_01",
                        "email": "user@example.com",
                        "name": "Test User"
                    }
                }
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(jsonBody)
                .addHeader("Content-Type", "application/json")
        )

        val response = authApi.login(LoginRequestDto("user@example.com", "secret123"))

        assertTrue(response.isSuccessful)
        val body = response.body()
        assertNotNull(body)
        assertTrue(body!!.success)
        assertEquals("jwt.valid.token", body.data?.accessToken)
        assertEquals("user@example.com", body.data?.user?.email)
    }

    @Test
    fun `login returns 401 Unauthorized on invalid credentials`() = runBlocking {
        val errorJson = """
            {
                "success": false,
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "Incorrect email or password"
                }
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(401)
                .setBody(errorJson)
                .addHeader("Content-Type", "application/json")
        )

        val response = authApi.login(LoginRequestDto("wrong@example.com", "wrongpass"))

        assertFalse(response.isSuccessful)
        assertEquals(401, response.code())
    }

    @Test
    fun `MockK mock verification works cleanly`() {
        val mockObserver = mockk<(String) -> Unit>(relaxed = true)
        mockObserver("test_event")
        verify(exactly = 1) { mockObserver("test_event") }
    }
}
