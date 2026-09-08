package com.example.vtryon.core.designsystem.icon

import android.view.View
import androidx.annotation.StringRes

/**
 * Accessibility helpers for the Hugeicons icon system.
 * Enforces correct TalkBack node generation and prevents decorative icons
 * from cluttering screen reader traversal.
 */
object IconAccessibility {

    /**
     * Explicitly marks an icon as decorative.
     * Removes content description and excludes it from the accessibility hierarchy.
     */
    fun markDecorative(view: View) {
        view.contentDescription = null
        view.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
    }

    /**
     * Applies a semantic icon's default accessibility description, or overrides it if provided.
     */
    fun applySemanticDescription(
        view: View,
        icon: VtoIcon,
        overrideDescription: CharSequence? = null
    ) {
        val description = overrideDescription
            ?: icon.defaultContentDescriptionRes?.let { view.context.getString(it) }

        if (description != null) {
            view.contentDescription = description
            view.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
        } else {
            markDecorative(view)
        }
    }

    /**
     * Assigns a localized string resource as the accessibility label.
     */
    fun applyDescription(view: View, @StringRes stringRes: Int) {
        view.contentDescription = view.context.getString(stringRes)
        view.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
    }
}
