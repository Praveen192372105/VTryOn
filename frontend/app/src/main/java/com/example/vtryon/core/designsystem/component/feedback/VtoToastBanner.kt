package com.example.vtryon.core.designsystem.component.feedback

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.annotation.DrawableRes
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.icon.VtoIconSize
import com.example.vtryon.core.designsystem.icon.VtoIconTone
import com.example.vtryon.core.designsystem.icon.VtoIconView
import com.example.vtryon.core.designsystem.motion.VtoMotion

/**
 * Custom transient in-app status banner (replacing Snackbar and Toast)
 * with slide/fade animation, Hugeicon support, and auto-dismissal.
 */
class VtoToastBanner private constructor(
    private val activity: Activity,
    private val message: CharSequence,
    private val icon: com.example.vtryon.core.designsystem.icon.VtoIcon? = null,
    @param:DrawableRes private val iconRes: Int? = null,
    private val durationMs: Long = 2500L
) {

    private val handler = Handler(Looper.getMainLooper())
    private var bannerView: LinearLayout? = null

    fun show() {
        val decorView = activity.window.decorView as? ViewGroup ?: return

        val banner = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            background = ContextCompat.getDrawable(activity, R.drawable.vto_bg_toast)

            val padH = (16 * resources.displayMetrics.density).toInt()
            val padV = (10 * resources.displayMetrics.density).toInt()
            setPadding(padH, padV, padH, padV)

            val marginB = (24 * resources.displayMetrics.density).toInt()
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
            ).apply {
                bottomMargin = marginB
            }

            alpha = 0f
            translationY = (20 * resources.displayMetrics.density)

            val effectiveIconRes = icon?.drawableRes ?: iconRes
            if (effectiveIconRes != null && effectiveIconRes != 0) {
                val iconView = VtoIconView(activity).apply {
                    if (icon != null) {
                        setIcon(icon, VtoIconTone.INVERSE)
                    } else {
                        setHugeicon(effectiveIconRes, VtoIconTone.INVERSE)
                    }
                    iconSize = VtoIconSize.SM
                    layoutParams = LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                    ).apply {
                        marginEnd = (8 * resources.displayMetrics.density).toInt()
                    }
                }
                addView(iconView)
            }

            val textView = TextView(activity).apply {
                text = message
                setTextAppearance(R.style.TextAppearance_VTryOn_LabelMedium)
                setTextColor(ContextCompat.getColor(activity, R.color.vto_content_inverse))
            }
            addView(textView)
        }

        bannerView = banner
        decorView.addView(banner)

        // Slide/fade in
        banner.animate()
            .alpha(1.0f)
            .translationY(0f)
            .setDuration(VtoMotion.DURATION_TRANSITION)
            .setInterpolator(VtoMotion.EASING_DECELERATE)
            .start()

        handler.postDelayed({
            dismiss()
        }, durationMs)
    }

    fun dismiss() {
        bannerView?.let { view ->
            view.animate()
                .alpha(0f)
                .translationY((20 * view.resources.displayMetrics.density))
                .setDuration(VtoMotion.DURATION_TRANSITION)
                .setInterpolator(VtoMotion.EASING_STANDARD)
                .withEndAction {
                    (view.parent as? ViewGroup)?.removeView(view)
                    bannerView = null
                }
                .start()
        }
    }

    companion object {
        fun make(
            activity: Activity,
            message: CharSequence,
            icon: com.example.vtryon.core.designsystem.icon.VtoIcon? = null,
            durationMs: Long = 2500L
        ): VtoToastBanner {
            return VtoToastBanner(activity, message, icon = icon, durationMs = durationMs)
        }

        fun make(
            activity: Activity,
            message: CharSequence,
            @DrawableRes iconRes: Int? = null,
            durationMs: Long = 2500L
        ): VtoToastBanner {
            return VtoToastBanner(activity, message, iconRes = iconRes, durationMs = durationMs)
        }
    }
}
