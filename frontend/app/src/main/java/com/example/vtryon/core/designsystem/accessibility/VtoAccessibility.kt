package com.example.vtryon.core.designsystem.accessibility

import android.graphics.Rect
import android.view.TouchDelegate
import android.view.View
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityManager
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat

/**
 * Accessibility helpers for TalkBack announcements, touch target expansion,
 * and semantic role configuration without Material dependencies.
 */
object VtoAccessibility {

    fun announce(view: View, message: CharSequence) {
        val am = view.context.getSystemService(AccessibilityManager::class.java)
        if (am != null && am.isEnabled) {
            @Suppress("DEPRECATION")
            val event = AccessibilityEvent.obtain(AccessibilityEvent.TYPE_ANNOUNCEMENT).apply {
                text.add(message)
                className = view.javaClass.name
                packageName = view.context.packageName
            }
            view.parent?.requestSendAccessibilityEvent(view, event)
        }
    }

    fun setHeading(view: View) {
        ViewCompat.setAccessibilityHeading(view, true)
    }

    fun setButtonRole(view: View) {
        ViewCompat.setAccessibilityDelegate(view, object : androidx.core.view.AccessibilityDelegateCompat() {
            override fun onInitializeAccessibilityNodeInfo(host: View, info: AccessibilityNodeInfoCompat) {
                super.onInitializeAccessibilityNodeInfo(host, info)
                info.className = "android.widget.Button"
            }
        })
    }

    /**
     * Expands touch bounds of a small view to meet the minimum 48dp touch target.
     */
    fun expandTouchTarget(parent: View, delegate: View, extraPaddingPx: Int) {
        parent.post {
            val rect = Rect()
            delegate.getHitRect(rect)
            rect.top -= extraPaddingPx
            rect.bottom += extraPaddingPx
            rect.left -= extraPaddingPx
            rect.right += extraPaddingPx
            parent.touchDelegate = TouchDelegate(rect, delegate)
        }
    }
}
