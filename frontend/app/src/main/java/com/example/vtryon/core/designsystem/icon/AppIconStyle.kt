package com.example.vtryon.core.designsystem.icon

import androidx.annotation.ColorRes
import com.example.vtryon.R

/**
 * Normalized semantic icon styles controlling tint and prominence.
 */
enum class AppIconStyle(@param:ColorRes val colorRes: Int) {
    PRIMARY(R.color.content_primary),
    SECONDARY(R.color.content_secondary),
    TERTIARY(R.color.content_tertiary),
    INVERSE(R.color.content_inverse),
    ERROR(R.color.state_error),
    SUCCESS(R.color.state_success),
    NONE(0)
}
