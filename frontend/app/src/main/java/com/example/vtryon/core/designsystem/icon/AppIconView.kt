package com.example.vtryon.core.designsystem.icon

import android.content.Context
import android.util.AttributeSet
import androidx.appcompat.widget.AppCompatImageView
import androidx.core.content.ContextCompat
import com.example.vtryon.R

/**
 * Standardized Hugeicon view enforcing semantic sizing, color tinting, and accessibility.
 */
class AppIconView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : AppCompatImageView(context, attrs, defStyleAttr) {

    private var iconSize: AppIconSize = AppIconSize.MD
    private var iconStyle: AppIconStyle = AppIconStyle.PRIMARY

    init {
        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.AppIconView)
            val sizeOrdinal = a.getInt(R.styleable.AppIconView_appIconSize, 2)
            iconSize = AppIconSize.entries.getOrElse(sizeOrdinal) { AppIconSize.MD }

            val styleOrdinal = a.getInt(R.styleable.AppIconView_appIconStyle, 0)
            iconStyle = AppIconStyle.entries.getOrElse(styleOrdinal) { AppIconStyle.PRIMARY }

            val srcRes = a.getResourceId(R.styleable.AppIconView_appIconSrc, 0)
            if (srcRes != 0) {
                setImageResource(srcRes)
            }
            a.recycle()
        }
        applyStyle()
    }

    fun setIconSize(size: AppIconSize) {
        this.iconSize = size
        requestLayout()
    }

    fun setIconStyle(style: AppIconStyle) {
        this.iconStyle = style
        applyStyle()
    }

    fun setHugeicon(drawableRes: Int, style: AppIconStyle = AppIconStyle.PRIMARY) {
        setImageResource(drawableRes)
        this.iconStyle = style
        applyStyle()
    }

    private fun applyStyle() {
        if (iconStyle.colorRes != 0) {
            setColorFilter(ContextCompat.getColor(context, iconStyle.colorRes))
        } else {
            clearColorFilter()
        }
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val targetPx = iconSize.toPx(context)
        val widthMode = MeasureSpec.getMode(widthMeasureSpec)
        val heightMode = MeasureSpec.getMode(heightMeasureSpec)

        val finalWidth = if (widthMode == MeasureSpec.EXACTLY) MeasureSpec.getSize(widthMeasureSpec) else targetPx
        val finalHeight = if (heightMode == MeasureSpec.EXACTLY) MeasureSpec.getSize(heightMeasureSpec) else targetPx

        setMeasuredDimension(finalWidth, finalHeight)
    }
}
