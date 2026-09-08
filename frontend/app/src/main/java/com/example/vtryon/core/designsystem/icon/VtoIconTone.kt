package com.example.vtryon.core.designsystem.icon

import androidx.annotation.ColorRes
import com.example.vtryon.R

/**
 * Semantic foreground color tones for Hugeicons.
 */
enum class VtoIconTone(@get:ColorRes val colorRes: Int) {
    PRIMARY(R.color.vto_content_primary),
    SECONDARY(R.color.vto_content_secondary),
    TERTIARY(R.color.vto_content_tertiary),
    INVERSE(R.color.vto_content_inverse),
    ERROR(R.color.vto_error),
    SUCCESS(R.color.vto_success),
    MUTED(R.color.vto_content_disabled),
    NONE(0);
}
