package com.example.vtryon.core.designsystem.component.feedback

import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.drawable.GradientDrawable
import android.util.AttributeSet
import android.view.View
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.motion.VtoReducedMotion

/**
 * Editorial skeleton placeholder surface preserving layout geometry with a subtle alpha pulse.
 * Disables animation when reduced motion is preferred.
 */
class VtoSkeleton @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val backgroundDrawable = GradientDrawable()
    private var pulseAnimator: ObjectAnimator? = null

    init {
        var cornerRadius = context.resources.getDimension(R.dimen.vto_radius_md)

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.VtoSkeleton)
            cornerRadius = a.getDimension(R.styleable.VtoSkeleton_vtoSkeletonCornerRadius, cornerRadius)
            a.recycle()
        }

        backgroundDrawable.apply {
            this.cornerRadius = cornerRadius
            setColor(ContextCompat.getColor(context, R.color.vto_surface_secondary))
        }
        background = backgroundDrawable

        initAnimator()
    }

    private fun initAnimator() {
        if (VtoReducedMotion.isReducedMotionEnabled(context)) {
            alpha = 0.8f
            return
        }

        pulseAnimator = ObjectAnimator.ofFloat(this, "alpha", 0.5f, 1.0f).apply {
            duration = 900L
            repeatCount = ValueAnimator.INFINITE
            repeatMode = ValueAnimator.REVERSE
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (visibility == VISIBLE && pulseAnimator?.isRunning != true && !VtoReducedMotion.isReducedMotionEnabled(context)) {
            pulseAnimator?.start()
        }
    }

    override fun onDetachedFromWindow() {
        pulseAnimator?.cancel()
        super.onDetachedFromWindow()
    }

    override fun onVisibilityChanged(changedView: View, visibility: Int) {
        super.onVisibilityChanged(changedView, visibility)
        if (visibility == VISIBLE) {
            if (pulseAnimator?.isRunning != true && !VtoReducedMotion.isReducedMotionEnabled(context)) {
                pulseAnimator?.start()
            }
        } else {
            pulseAnimator?.cancel()
        }
    }
}
