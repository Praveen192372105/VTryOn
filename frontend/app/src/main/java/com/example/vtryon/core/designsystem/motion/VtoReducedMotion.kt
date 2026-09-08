package com.example.vtryon.core.designsystem.motion

import android.content.Context
import android.provider.Settings

/**
 * Utility for querying system animation scale and accessibility preferences.
 */
object VtoReducedMotion {

    fun isReducedMotionEnabled(context: Context): Boolean {
        val durationScale = try {
            Settings.Global.getFloat(
                context.contentResolver,
                Settings.Global.ANIMATOR_DURATION_SCALE,
                1.0f
            )
        } catch (_: Exception) {
            1.0f
        }
        return durationScale == 0f
    }
}
