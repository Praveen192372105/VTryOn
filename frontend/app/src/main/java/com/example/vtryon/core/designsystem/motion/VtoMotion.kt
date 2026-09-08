package com.example.vtryon.core.designsystem.motion

import android.view.animation.Interpolator
import androidx.core.view.animation.PathInterpolatorCompat

/**
 * Centralized motion tokens and interpolators adhering to fashion editorial restraint.
 */
object VtoMotion {
    const val DURATION_INSTANT: Long = 100L
    const val DURATION_MICRO: Long = 160L
    const val DURATION_STANDARD: Long = 220L
    const val DURATION_TRANSITION: Long = 280L

    // Deceleration curve for natural entry motion (0.05, 0.7, 0.1, 1.0)
    val EASING_DECELERATE: Interpolator = PathInterpolatorCompat.create(0.05f, 0.7f, 0.1f, 1.0f)

    // Standard smooth fashion ease (0.2, 0.0, 0.0, 1.0)
    val EASING_STANDARD: Interpolator = PathInterpolatorCompat.create(0.2f, 0.0f, 0.0f, 1.0f)

    // Tactile press scale
    const val PRESS_SCALE: Float = 0.985f
}
