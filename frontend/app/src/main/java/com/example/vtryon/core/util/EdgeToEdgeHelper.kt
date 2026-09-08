package com.example.vtryon.core.util

import android.view.View
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

/**
 * Modern Edge-to-Edge inset helper accounting for status bar, navigation bar,
 * gesture navigation bars, display cutouts, and IME soft keyboard.
 */
object EdgeToEdgeHelper {

    fun applySystemBarInsets(
        view: View,
        applyTop: Boolean = true,
        applyBottom: Boolean = true,
        applyHorizontal: Boolean = false
    ) {
        val initialPaddingLeft = view.paddingLeft
        val initialPaddingTop = view.paddingTop
        val initialPaddingRight = view.paddingRight
        val initialPaddingBottom = view.paddingBottom

        ViewCompat.setOnApplyWindowInsetsListener(view) { v, windowInsets ->
            val insets = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )

            v.setPadding(
                if (applyHorizontal) initialPaddingLeft + insets.left else initialPaddingLeft,
                if (applyTop) initialPaddingTop + insets.top else initialPaddingTop,
                if (applyHorizontal) initialPaddingRight + insets.right else initialPaddingRight,
                if (applyBottom) initialPaddingBottom + insets.bottom else initialPaddingBottom
            )

            windowInsets
        }
        ViewCompat.requestApplyInsets(view)
    }

    fun applyImeAndBottomInsets(view: View) {
        val initialBottom = view.paddingBottom

        ViewCompat.setOnApplyWindowInsetsListener(view) { v, windowInsets ->
            val imeInsets = windowInsets.getInsets(WindowInsetsCompat.Type.ime())
            val navInsets = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars())

            val bottomInset = maxOf(imeInsets.bottom, navInsets.bottom)
            v.setPadding(
                v.paddingLeft,
                v.paddingTop,
                v.paddingRight,
                initialBottom + bottomInset
            )

            windowInsets
        }
        ViewCompat.requestApplyInsets(view)
    }
}
