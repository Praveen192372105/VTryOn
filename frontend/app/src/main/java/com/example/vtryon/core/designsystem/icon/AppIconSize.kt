package com.example.vtryon.core.designsystem.icon

import android.content.Context
import android.util.TypedValue
import androidx.annotation.DimenRes
import com.example.vtryon.R

/**
 * Normalized semantic icon size tokens for the design system.
 * Prevents arbitrary icon sizes from being scattered across screens.
 */
enum class AppIconSize(val dp: Int, @param:DimenRes val dimenRes: Int) {
    XS(16, R.dimen.icon_size_xs),
    SM(18, R.dimen.icon_size_sm),
    MD(20, R.dimen.icon_size_md),
    LG(24, R.dimen.icon_size_lg),
    XL(28, R.dimen.icon_size_xl);

    fun toPx(context: Context): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dp.toFloat(),
            context.resources.displayMetrics
        ).toInt()
    }
}
