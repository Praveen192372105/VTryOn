package com.example.vtryon.app

import android.app.Application
import coil.ImageLoader
import coil.ImageLoaderFactory
import coil.disk.DiskCache
import coil.memory.MemoryCache
import com.example.vtryon.core.database.AppDatabase
import com.example.vtryon.core.datastore.AppSettingsStore
import com.example.vtryon.core.network.ApiClient
import com.example.vtryon.core.security.TokenStorage
import kotlinx.coroutines.launch

/**
 * Root Application class initializing the core foundation layers:
 * Security (TokenStorage), Network (ApiClient), Database (Room), DataStore, and Image Loading (Coil).
 */
class TryOnApplication : Application(), ImageLoaderFactory {

    lateinit var tokenStorage: TokenStorage
        private set

    lateinit var apiClient: ApiClient
        private set

    lateinit var database: AppDatabase
        private set

    lateinit var settingsStore: AppSettingsStore
        private set

    lateinit var authRepository: com.example.vtryon.domain.repository.AuthRepository
        private set

    lateinit var outfitRepository: com.example.vtryon.domain.repository.OutfitRepository
        private set

    lateinit var tryOnRepository: com.example.vtryon.domain.repository.TryOnRepository
        private set

    lateinit var imageCompressor: com.example.vtryon.core.image.ImageCompressor
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        if (com.example.vtryon.BuildConfig.DEBUG) {
            timber.log.Timber.plant(timber.log.Timber.DebugTree())
        }

        tokenStorage = TokenStorage(this)
        apiClient = ApiClient(tokenStorage = tokenStorage)
        database = AppDatabase.getInstance(this)
        settingsStore = AppSettingsStore(this)
        imageCompressor = com.example.vtryon.core.image.ImageCompressor(this)

        authRepository = com.example.vtryon.data.repository.AuthRepositoryImpl(
            authApi = apiClient.authApi,
            userApi = apiClient.userApi,
            tokenStorage = tokenStorage
        )
        outfitRepository = com.example.vtryon.data.repository.OutfitRepositoryImpl(
            outfitApi = apiClient.outfitApi,
            outfitDao = database.outfitDao()
        )
        tryOnRepository = com.example.vtryon.data.repository.TryOnRepositoryImpl(
            tryOnApi = apiClient.tryOnApi,
            uploadApi = apiClient.uploadApi,
            outfitApi = apiClient.outfitApi,
            tryOnDao = database.tryOnDao()
        )

        kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.Main).launch {
            settingsStore.themeMode.collect { mode ->
                val nightMode = when (mode) {
                    AppSettingsStore.ThemeMode.DARK -> androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_YES
                    AppSettingsStore.ThemeMode.LIGHT -> androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_NO
                    AppSettingsStore.ThemeMode.SYSTEM -> androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
                }
                if (androidx.appcompat.app.AppCompatDelegate.getDefaultNightMode() != nightMode) {
                    androidx.appcompat.app.AppCompatDelegate.setDefaultNightMode(nightMode)
                }
            }
        }
    }

    override fun newImageLoader(): ImageLoader {
        return com.example.vtryon.core.image.CoilConfiguration.createImageLoader(
            context = this,
            okHttpClient = apiClient.okHttpClient
        )
    }

    companion object {
        lateinit var instance: TryOnApplication
            private set
    }
}
