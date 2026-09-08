package com.example.vtryon.core.datastore

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "vtryon_settings")

/**
 * Manages lightweight application preferences via Jetpack DataStore.
 * Handles theme mode, onboarding, and local try-on bookmarks.
 */
class AppSettingsStore(private val context: Context) {

    enum class ThemeMode {
        SYSTEM,
        LIGHT,
        DARK
    }

    data class AppSettings(
        val themeMode: ThemeMode,
        val onboardingCompleted: Boolean,
        val offlineMode: Boolean,
        val localBookmarks: Set<String>
    )

    val settingsFlow: Flow<AppSettings> = context.dataStore.data.map { preferences ->
        val themeString = preferences[KEY_THEME_MODE] ?: ThemeMode.SYSTEM.name
        val themeMode = try {
            ThemeMode.valueOf(themeString)
        } catch (_: Exception) {
            ThemeMode.SYSTEM
        }

        val onboarding = preferences[KEY_ONBOARDING_COMPLETED] ?: false
        val offline = preferences[KEY_OFFLINE_MODE] ?: false
        val bookmarks = preferences[KEY_LOCAL_BOOKMARKS] ?: emptySet()

        AppSettings(
            themeMode = themeMode,
            onboardingCompleted = onboarding,
            offlineMode = offline,
            localBookmarks = bookmarks
        )
    }

    val themeMode: Flow<ThemeMode> = settingsFlow.map { it.themeMode }

    suspend fun setThemeMode(mode: ThemeMode) {
        context.dataStore.edit { preferences ->
            preferences[KEY_THEME_MODE] = mode.name
        }
    }

    suspend fun setOnboardingCompleted(completed: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_ONBOARDING_COMPLETED] = completed
        }
    }

    suspend fun toggleLocalBookmark(tryOnId: String) {
        context.dataStore.edit { preferences ->
            val current = preferences[KEY_LOCAL_BOOKMARKS]?.toMutableSet() ?: mutableSetOf()
            if (current.contains(tryOnId)) {
                current.remove(tryOnId)
            } else {
                current.add(tryOnId)
            }
            preferences[KEY_LOCAL_BOOKMARKS] = current
        }
    }

    companion object {
        private val KEY_THEME_MODE = stringPreferencesKey("app_theme_mode")
        private val KEY_ONBOARDING_COMPLETED = booleanPreferencesKey("onboarding_completed")
        private val KEY_OFFLINE_MODE = booleanPreferencesKey("offline_mode_enabled")
        private val KEY_LOCAL_BOOKMARKS = stringSetPreferencesKey("local_tryon_bookmarks")
    }
}
