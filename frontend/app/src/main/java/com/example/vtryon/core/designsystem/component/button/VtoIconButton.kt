package com.example.vtryon.core.designsystem.component.button

import android.content.Context
import android.graphics.drawable.GradientDrawable
import android.util.AttributeSet
import android.view.Gravity
import android.view.MotionEvent
import android.widget.FrameLayout
import androidx.annotation.DrawableRes
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.accessibility.VtoAccessibility
import com.example.vtryon.core.designsystem.icon.VtoIconSize
import com.example.vtryon.core.designsystem.icon.VtoIconTone
import com.example.vtryon.core.designsystem.icon.VtoIconView
import com.example.vtryon.core.designsystem.motion.VtoMotion

/**
 * Tactical icon button with 48dp interactive touch target, 20-24dp visible Hugeicon,
 * tactile press feedback, and required accessible content description.
 */
class VtoIconButton @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    enum class Variant {
        STANDARD,
        QUIET,
        FLOATING,
        INVERSE_ON_MEDIA,
        DESTRUCTIVE
    }

    private val iconView = VtoIconView(context).apply {
        iconSize = VtoIconSize.LG
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER)
    }

    var variant: Variant = Variant.QUIET
        set(value) {
            field = value
            applyVariant()
        }

    init {
        isClickable = true
        isFocusable = true

        val minTarget = context.resources.getDimensionPixelSize(R.dimen.vto_touch_min)
        minimumWidth = minTarget
        minimumHeight = minTarget

        addView(iconView)
        VtoAccessibility.setButtonRole(this)

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.VtoIconButton)
            val iconRes = a.getResourceId(R.styleable.VtoIconButton_vtoIcon, 0)
            if (iconRes != 0) {
                iconView.setImageResource(iconRes)
            }
            val variantOrdinal = a.getInt(R.styleable.VtoIconButton_vtoIconVariant, 1)
            variant = Variant.entries.getOrElse(variantOrdinal) { Variant.QUIET }

            val contentDesc = a.getString(R.styleable.VtoIconButton_vtoContentDescription)
            if (!contentDesc.isNullOrEmpty()) {
                contentDescription = contentDesc
            }
            a.recycle()
        }
        applyVariant()
    }

    fun setIcon(icon: com.example.vtryon.core.designsystem.icon.VtoIcon, contentDescriptionText: CharSequence? = null) {
        val desc = contentDescriptionText
            ?: icon.defaultContentDescriptionRes?.let { context.getString(it) }
        iconView.setIcon(icon)
        contentDescription = desc
    }

    fun setHugeicon(@DrawableRes drawableRes: Int, contentDescriptionText: CharSequence) {
        iconView.setImageResource(drawableRes)
        contentDescription = contentDescriptionText
    }

    private fun applyVariant() {
        when (variant) {
            Variant.STANDARD -> {
                background = ContextCompat.getDrawable(context, R.drawable.vto_bg_btn_secondary)
                iconView.iconTone = VtoIconTone.PRIMARY
            }
            Variant.QUIET -> {
                background = ContextCompat.getDrawable(context, R.drawable.vto_bg_btn_ghost)
                iconView.iconTone = VtoIconTone.PRIMARY
            }
            Variant.FLOATING -> {
                val shape = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(ContextCompat.getColor(context, R.color.vto_surface_elevated))
                    setStroke(1, ContextCompat.getColor(context, R.color.vto_border_strong))
                }
                background = shape
                iconView.iconTone = VtoIconTone.PRIMARY
            }
            Variant.INVERSE_ON_MEDIA -> {
                val shape = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(0x80000000.toInt())
                    setStroke(1, 0x33FFFFFF)
                }
                background = shape
                iconView.iconTone = VtoIconTone.INVERSE
            }
            Variant.DESTRUCTIVE -> {
                background = ContextCompat.getDrawable(context, R.drawable.vto_bg_btn_ghost)
                iconView.iconTone = VtoIconTone.ERROR
            }
        }
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (!isEnabled) return super.onTouchEvent(event)

        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                animate().scaleX(VtoMotion.PRESS_SCALE)
                    .scaleY(VtoMotion.PRESS_SCALE)
                    .setDuration(VtoMotion.DURATION_INSTANT)
                    .start()
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                animate().scaleX(1.0f)
                    .scaleY(1.0f)
                    .setDuration(VtoMotion.DURATION_INSTANT)
                    .start()
            }
        }
        return super.onTouchEvent(event)
    }
}
