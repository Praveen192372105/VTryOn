package com.example.vtryon.core.designsystem.component.feedback

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.View
import android.view.animation.LinearInterpolator
import androidx.annotation.ColorInt
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.motion.VtoReducedMotion

/**
 * Premium custom indeterminate progress ring with zero allocations during onDraw.
 * Respects system accessibility reduced-motion settings.
 */
class VtoProgressRing @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val ringPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }

    private val boundsRect = RectF()
    private var currentSweep: Float = 270f
    private var currentRotation: Float = 0f
    private var strokeWidthPx: Float = 3f * resources.displayMetrics.density

    private var rotationAnimator: ValueAnimator? = null

    init {
        var ringColor = ContextCompat.getColor(context, R.color.vto_control_primary)
        var ringSize = (24 * resources.displayMetrics.density).toInt()

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.VtoProgressRing)
            ringColor = a.getColor(R.styleable.VtoProgressRing_vtoRingColor, ringColor)
            strokeWidthPx = a.getDimension(R.styleable.VtoProgressRing_vtoRingStrokeWidth, strokeWidthPx)
            ringSize = a.getDimensionPixelSize(R.styleable.VtoProgressRing_vtoRingSize, ringSize)
            a.recycle()
        }

        ringPaint.color = ringColor
        ringPaint.strokeWidth = strokeWidthPx

        initAnimator()
    }

    private fun initAnimator() {
        if (VtoReducedMotion.isReducedMotionEnabled(context)) {
            currentRotation = 45f
            currentSweep = 300f
            return
        }

        rotationAnimator = ValueAnimator.ofFloat(0f, 360f).apply {
            duration = 1000L
            repeatCount = ValueAnimator.INFINITE
            interpolator = LinearInterpolator()
            addUpdateListener { anim ->
                currentRotation = anim.animatedValue as Float
                invalidate()
            }
        }
    }

    fun setRingColor(@ColorInt color: Int) {
        ringPaint.color = color
        invalidate()
    }

    fun setStrokeWidth(widthPx: Float) {
        strokeWidthPx = widthPx
        ringPaint.strokeWidth = widthPx
        updateBounds()
        invalidate()
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        updateBounds()
    }

    private fun updateBounds() {
        val halfStroke = strokeWidthPx / 2f
        boundsRect.set(
            paddingLeft + halfStroke,
            paddingTop + halfStroke,
            width - paddingRight - halfStroke,
            height - paddingBottom - halfStroke
        )
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        canvas.save()
        canvas.rotate(currentRotation, boundsRect.centerX(), boundsRect.centerY())
        canvas.drawArc(boundsRect, 0f, currentSweep, false, ringPaint)
        canvas.restore()
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (visibility == VISIBLE && rotationAnimator?.isRunning != true && !VtoReducedMotion.isReducedMotionEnabled(context)) {
            rotationAnimator?.start()
        }
    }

    override fun onDetachedFromWindow() {
        rotationAnimator?.cancel()
        super.onDetachedFromWindow()
    }

    override fun onVisibilityChanged(changedView: View, visibility: Int) {
        super.onVisibilityChanged(changedView, visibility)
        if (visibility == VISIBLE) {
            if (rotationAnimator?.isRunning != true && !VtoReducedMotion.isReducedMotionEnabled(context)) {
                rotationAnimator?.start()
            }
        } else {
            rotationAnimator?.cancel()
        }
    }
}
