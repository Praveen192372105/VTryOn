package com.example.vtryon.core.designsystem.icon

import android.content.Context
import androidx.annotation.DimenRes
import com.example.vtryon.R

/**
 * Standardized semantic icon sizes adhering to mobile-native 8dp rhythm.
 */
enum class VtoIconSize(@get:DimenRes val dimenRes: Int) {
    XS(R.dimen.vto_icon_xs),     // 16dp
    SM(R.dimen.vto_icon_sm),     // 18dp
    MD(R.dimen.vto_icon_md),     // 20dp
    LG(R.dimen.vto_icon_lg),     // 24dp
    HERO(R.dimen.vto_icon_hero); // 28dp

    fun toPx(context: Context): Int = context.resources.getDimensionPixelSize(dimenRes)
}
