package com.example.vtryon.core.network

import com.example.vtryon.core.security.TokenStorage
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Central Retrofit client builder configured for FastAPI communication.
 * Supports 60s CatVTON inference polling and sanitized HTTP logging.
 */
class ApiClient(
    private val tokenStorage: TokenStorage,
    private val baseUrl: String = DEFAULT_BASE_URL,
    private val onSessionExpired: (() -> Unit)? = null
) {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BASIC
        redactHeader("Authorization")
        redactHeader("Cookie")
    }

    private val authInterceptor = AuthInterceptor(tokenStorage, onSessionExpired)

    val okHttpClient: OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(okHttpClient)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()

    fun <T> createService(serviceClass: Class<T>): T {
        return retrofit.create(serviceClass)
    }

    val authApi: com.example.vtryon.data.remote.auth.AuthApi by lazy { createService(com.example.vtryon.data.remote.auth.AuthApi::class.java) }
    val userApi: com.example.vtryon.data.remote.user.UserApi by lazy { createService(com.example.vtryon.data.remote.user.UserApi::class.java) }
    val outfitApi: com.example.vtryon.data.remote.outfit.OutfitApi by lazy { createService(com.example.vtryon.data.remote.outfit.OutfitApi::class.java) }
    val tryOnApi: com.example.vtryon.data.remote.tryon.TryOnApi by lazy { createService(com.example.vtryon.data.remote.tryon.TryOnApi::class.java) }
    val uploadApi: com.example.vtryon.data.remote.upload.UploadApi by lazy { createService(com.example.vtryon.data.remote.upload.UploadApi::class.java) }

    companion object {
        // Automatically detect if running inside Android Emulator or physical device
        val isEmulator: Boolean
            get() = (android.os.Build.FINGERPRINT.startsWith("generic")
                    || android.os.Build.FINGERPRINT.startsWith("unknown")
                    || android.os.Build.MODEL.contains("google_sdk")
                    || android.os.Build.MODEL.contains("Emulator")
                    || android.os.Build.MODEL.contains("Android SDK built for x86")
                    || android.os.Build.HARDWARE.contains("goldfish")
                    || android.os.Build.HARDWARE.contains("ranchu"))

        // Host machine IP from ipconfig: 192.168.31.44
        // Standard Android Emulator loopback is 10.0.2.2; physical device connects directly to host IP
        const val HOST_IP = "192.168.31.44"

        val DEFAULT_BASE_URL: String
            get() = if (isEmulator) "http://10.0.2.2:8000/" else "http://$HOST_IP:8000/"
    }
}
