package com.example.vtryon.core.designsystem.brand

import android.content.Context
import android.content.res.TypedArray
import android.graphics.Canvas
import android.graphics.Color
import android.util.AttributeSet
import android.view.View
import androidx.annotation.ColorInt
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import kotlin.math.min

/**
 * Reusable native Android View rendering the canonical V Try-On brand logo.
 *
 * Guarantees:
 * - Exact vector fidelity matching the official web application.
 * - Strict 1:1 aspect ratio preservation regardless of layout constraints.
 * - Monochrome palette adaptation matching the active system or app theme.
 * - Clean XML configuration via attributes: `logoColor`, `logoSize`, `logoDecorative`, `logoTitle`.
 */
class AppLogoView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val logoDrawable: AppLogoDrawable = AppLogoDrawable()
    private var defaultSizePx: Int

    init {
        val density = context.resources.displayMetrics.density
        defaultSizePx = (AppLogoConstants.DEFAULT_SIZE_DP * density).toInt()

        // Resolve default theme-aware brand color
        val defaultColor = ContextCompat.getColor(context, R.color.brand_logo_color)
        var resolvedColor = defaultColor
        var customSizePx = -1
        var isDecorative = false
        var customTitle: String? = null

        if (attrs != null) {
            val a: TypedArray = context.obtainStyledAttributes(attrs, R.styleable.AppLogoView, defStyleAttr, 0)
            try {
                resolvedColor = a.getColor(R.styleable.AppLogoView_logoColor, defaultColor)
                customSizePx = a.getDimensionPixelSize(R.styleable.AppLogoView_logoSize, -1)
                isDecorative = a.getBoolean(R.styleable.AppLogoView_logoDecorative, false)
                customTitle = a.getString(R.styleable.AppLogoView_logoTitle)
            } finally {
                a.recycle()
            }
        }

        if (customSizePx > 0) {
            defaultSizePx = customSizePx
        }

        logoDrawable.logoColor = resolvedColor
        logoDrawable.setIntrinsicSize(defaultSizePx)

        // Accessibility configuration
        if (isDecorative) {
            importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
            contentDescription = null
        } else {
            importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_YES
            contentDescription = customTitle ?: context.getString(R.string.app_name)
        }
    }

    /**
     * Programmatically update the logo tint color.
     */
    var logoColor: Int
        @ColorInt get() = logoDrawable.logoColor
        set(@ColorInt value) {
            logoDrawable.logoColor = value
            invalidate()
        }

    /**
     * Configure accessibility decorative status.
     */
    fun setDecorative(decorative: Boolean, title: String? = null) {
        if (decorative) {
            importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
            contentDescription = null
        } else {
            importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_YES
            contentDescription = title ?: context.getString(R.string.app_name)
        }
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val widthMode = MeasureSpec.getMode(widthMeasureSpec)
        val widthSize = MeasureSpec.getSize(widthMeasureSpec)
        val heightMode = MeasureSpec.getMode(heightMeasureSpec)
        val heightSize = MeasureSpec.getSize(heightMeasureSpec)

        val desiredWidth = defaultSizePx + paddingLeft + paddingRight
        val desiredHeight = defaultSizePx + paddingTop + paddingBottom

        val measuredWidth = when (widthMode) {
            MeasureSpec.EXACTLY -> widthSize
            MeasureSpec.AT_MOST -> min(desiredWidth, widthSize)
            else -> desiredWidth
        }

        val measuredHeight = when (heightMode) {
            MeasureSpec.EXACTLY -> heightSize
            MeasureSpec.AT_MOST -> min(desiredHeight, heightSize)
            else -> desiredHeight
        }

        // Maintain strict 1:1 aspect ratio inside available space
        val contentW = (measuredWidth - paddingLeft - paddingRight).coerceAtLeast(0)
        val contentH = (measuredHeight - paddingTop - paddingBottom).coerceAtLeast(0)
        val side = min(contentW, contentH)

        val finalWidth = if (widthMode == MeasureSpec.EXACTLY) measuredWidth else side + paddingLeft + paddingRight
        val finalHeight = if (heightMode == MeasureSpec.EXACTLY) measuredHeight else side + paddingTop + paddingBottom

        setMeasuredDimension(finalWidth, finalHeight)
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        val contentW = w - paddingLeft - paddingRight
        val contentH = h - paddingTop - paddingBottom
        val side = min(contentW, contentH).coerceAtLeast(0)

        val left = paddingLeft + (contentW - side) / 2
        val top = paddingTop + (contentH - side) / 2
        logoDrawable.setBounds(left, top, left + side, top + side)
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        logoDrawable.draw(canvas)
    }

    override fun verifyDrawable(who: android.graphics.drawable.Drawable): Boolean {
        return who === logoDrawable || super.verifyDrawable(who)
    }
}
