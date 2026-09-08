package com.example.vtryon.core.designsystem.component

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Context
import android.util.AttributeSet
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import androidx.annotation.DrawableRes
import androidx.appcompat.widget.AppCompatTextView
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.icon.AppIconSize
import com.example.vtryon.core.designsystem.icon.AppIconStyle
import com.example.vtryon.core.designsystem.icon.AppIconView

/**
 * Custom non-Material button component tailored for monochrome fashion aesthetic.
 * Strictly adheres to 48dp touch targets, tactile press feedback, and Hugeicons.
 */
class AppButton @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    enum class Variant {
        PRIMARY,
        SECONDARY,
        GHOST,
        DANGER,
        ICON
    }

    enum class Size {
        SM,
        MD,
        LG
    }

    private val contentLayout = LinearLayout(context).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER)
    }

    private val leadingIconView = AppIconView(context).apply {
        visibility = View.GONE
    }

    private val textView = AppCompatTextView(context).apply {
        gravity = Gravity.CENTER
        includeFontPadding = false
        setTextAppearance(context, R.style.TextAppearance_VTryOn_LabelLarge)
    }

    private val trailingIconView = AppIconView(context).apply {
        visibility = View.GONE
    }

    private val progressBar = ProgressBar(context, null, android.R.attr.progressBarStyleSmall).apply {
        visibility = View.GONE
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER)
    }

    private var variant: Variant = Variant.PRIMARY
    private var buttonSize: Size = Size.MD
    private var isLoading: Boolean = false

    init {
        contentLayout.addView(leadingIconView)
        contentLayout.addView(textView)
        contentLayout.addView(trailingIconView)

        addView(contentLayout)
        addView(progressBar)

        isClickable = true
        isFocusable = true

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.AppButton)
            val variantOrdinal = a.getInt(R.styleable.AppButton_btnVariant, 0)
            variant = Variant.entries.getOrElse(variantOrdinal) { Variant.PRIMARY }

            val sizeOrdinal = a.getInt(R.styleable.AppButton_btnSize, 1)
            buttonSize = Size.entries.getOrElse(sizeOrdinal) { Size.MD }

            val text = a.getString(R.styleable.AppButton_btnText)
            if (!text.isNullOrEmpty()) {
                setText(text)
            }

            val leadingRes = a.getResourceId(R.styleable.AppButton_btnLeadingIcon, 0)
            if (leadingRes != 0) {
                setLeadingIcon(leadingRes)
            }

            val trailingRes = a.getResourceId(R.styleable.AppButton_btnTrailingIcon, 0)
            if (trailingRes != 0) {
                setTrailingIcon(trailingRes)
            }

            isLoading = a.getBoolean(R.styleable.AppButton_btnLoading, false)
            a.recycle()
        }

        applyStyling()
        applyLoadingState()
    }

    fun setText(text: CharSequence) {
        textView.text = text
        textView.visibility = if (text.isNotEmpty()) View.VISIBLE else View.GONE
    }

    fun setLeadingIcon(@DrawableRes iconRes: Int?) {
        if (iconRes != null && iconRes != 0) {
            leadingIconView.setHugeicon(iconRes, getIconStyleForVariant())
            leadingIconView.setIconSize(if (buttonSize == Size.SM) AppIconSize.SM else AppIconSize.MD)
            leadingIconView.visibility = View.VISIBLE
            val margin = (4 * resources.displayMetrics.density).toInt()
            (leadingIconView.layoutParams as? ViewGroup.MarginLayoutParams)?.rightMargin = margin
        } else {
            leadingIconView.visibility = View.GONE
        }
    }

    fun setTrailingIcon(@DrawableRes iconRes: Int?) {
        if (iconRes != null && iconRes != 0) {
            trailingIconView.setHugeicon(iconRes, getIconStyleForVariant())
            trailingIconView.setIconSize(if (buttonSize == Size.SM) AppIconSize.SM else AppIconSize.MD)
            trailingIconView.visibility = View.VISIBLE
            val margin = (4 * resources.displayMetrics.density).toInt()
            (trailingIconView.layoutParams as? ViewGroup.MarginLayoutParams)?.leftMargin = margin
        } else {
            trailingIconView.visibility = View.GONE
        }
    }

    fun setVariant(variant: Variant) {
        this.variant = variant
        applyStyling()
    }

    fun setLoading(loading: Boolean) {
        this.isLoading = loading
        isEnabled = !loading
        applyLoadingState()
    }

    private fun applyStyling() {
        val hPadding = when (buttonSize) {
            Size.SM -> (12 * resources.displayMetrics.density).toInt()
            Size.MD -> (20 * resources.displayMetrics.density).toInt()
            Size.LG -> (24 * resources.displayMetrics.density).toInt()
        }
        setPadding(hPadding, 0, hPadding, 0)

        val bgDrawable = when (variant) {
            Variant.PRIMARY -> ContextCompat.getDrawable(context, R.drawable.bg_btn_primary)
            Variant.SECONDARY -> ContextCompat.getDrawable(context, R.drawable.bg_btn_secondary)
            Variant.GHOST -> ContextCompat.getDrawable(context, R.drawable.bg_btn_ghost)
            Variant.DANGER -> ContextCompat.getDrawable(context, R.drawable.bg_btn_danger)
            Variant.ICON -> ContextCompat.getDrawable(context, R.drawable.bg_btn_ghost)
        }
        background = bgDrawable

        val textColorRes = when (variant) {
            Variant.PRIMARY -> R.color.btn_primary_text
            Variant.SECONDARY -> R.color.btn_secondary_text
            Variant.GHOST -> R.color.btn_ghost_text
            Variant.DANGER -> R.color.btn_danger_text
            Variant.ICON -> R.color.content_primary
        }
        textView.setTextColor(ContextCompat.getColor(context, textColorRes))
        leadingIconView.setIconStyle(getIconStyleForVariant())
        trailingIconView.setIconStyle(getIconStyleForVariant())
    }

    private fun getIconStyleForVariant(): AppIconStyle {
        return when (variant) {
            Variant.PRIMARY -> AppIconStyle.INVERSE
            Variant.DANGER -> AppIconStyle.INVERSE
            Variant.SECONDARY -> AppIconStyle.PRIMARY
            Variant.GHOST -> AppIconStyle.PRIMARY
            Variant.ICON -> AppIconStyle.PRIMARY
        }
    }

    private fun applyLoadingState() {
        if (isLoading) {
            contentLayout.visibility = View.INVISIBLE
            progressBar.visibility = View.VISIBLE
        } else {
            contentLayout.visibility = View.VISIBLE
            progressBar.visibility = View.GONE
        }
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val targetHeight = when (buttonSize) {
            Size.SM -> resources.getDimensionPixelSize(R.dimen.button_height_sm)
            Size.MD -> resources.getDimensionPixelSize(R.dimen.button_height_default)
            Size.LG -> resources.getDimensionPixelSize(R.dimen.button_height_lg)
        }
        val minTarget = resources.getDimensionPixelSize(R.dimen.min_touch_target)
        val finalHeight = maxOf(targetHeight, minTarget)

        val heightSpec = MeasureSpec.makeMeasureSpec(finalHeight, MeasureSpec.EXACTLY)
        super.onMeasure(widthMeasureSpec, heightSpec)
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (!isEnabled || isLoading) return super.onTouchEvent(event)

        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                animateScale(0.98f)
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                animateScale(1.0f)
            }
        }
        return super.onTouchEvent(event)
    }

    private fun animateScale(scale: Float) {
        val scaleXAnim = ObjectAnimator.ofFloat(this, "scaleX", scale).setDuration(80)
        val scaleYAnim = ObjectAnimator.ofFloat(this, "scaleY", scale).setDuration(80)
        AnimatorSet().apply {
            playTogether(scaleXAnim, scaleYAnim)
            start()
        }
    }
}
