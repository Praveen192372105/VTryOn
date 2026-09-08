package com.example.vtryon.core.designsystem.icon

import android.content.Context
import android.util.AttributeSet
import androidx.annotation.DrawableRes
import androidx.appcompat.widget.AppCompatImageView
import androidx.core.content.ContextCompat
import com.example.vtryon.R

/**
 * Standardized Hugeicon view component enforcing semantic tokens, semantic sizing,
 * color tone tinting, and accessibility compliance across phone and tablet layouts.
 */
class VtoIconView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : AppCompatImageView(context, attrs, defStyleAttr) {

    var iconSize: VtoIconSize = VtoIconSize.MD
        set(value) {
            field = value
            requestLayout()
        }

    var iconTone: VtoIconTone = VtoIconTone.PRIMARY
        set(value) {
            field = value
            applyTone()
        }

    var currentIcon: VtoIcon? = null
        private set

    init {
        scaleType = ScaleType.FIT_CENTER

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.VtoIconView)
            val sizeOrdinal = a.getInt(R.styleable.VtoIconView_vtoIconSize, 2)
            iconSize = VtoIconSize.entries.getOrElse(sizeOrdinal) { VtoIconSize.MD }

            val toneOrdinal = a.getInt(R.styleable.VtoIconView_vtoIconTone, 0)
            iconTone = VtoIconTone.entries.getOrElse(toneOrdinal) { VtoIconTone.PRIMARY }

            val srcRes = a.getResourceId(R.styleable.VtoIconView_vtoIconSrc, 0)
            if (srcRes != 0) {
                setImageResource(srcRes)
            }
            a.recycle()
        }
        applyTone()
    }

    /**
     * Assigns a strongly-typed semantic [VtoIcon] token with optional tone and accessibility override.
     */
    fun setIcon(
        icon: VtoIcon,
        tone: VtoIconTone = this.iconTone,
        contentDescription: CharSequence? = null
    ) {
        currentIcon = icon
        setImageResource(icon.drawableRes)
        this.iconTone = tone
        IconAccessibility.applySemanticDescription(this, icon, contentDescription)
    }

    fun setTone(tone: VtoIconTone) {
        this.iconTone = tone
    }

    fun setSize(size: VtoIconSize) {
        this.iconSize = size
    }

    fun setHugeicon(@DrawableRes drawableRes: Int, tone: VtoIconTone = VtoIconTone.PRIMARY) {
        currentIcon = null
        setImageResource(drawableRes)
        this.iconTone = tone
    }

    private fun applyTone() {
        if (iconTone.colorRes != 0) {
            setColorFilter(ContextCompat.getColor(context, iconTone.colorRes))
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
