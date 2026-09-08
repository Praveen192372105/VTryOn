package com.example.vtryon.core.designsystem.component.button

import android.content.Context
import android.util.AttributeSet
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.annotation.DrawableRes
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.accessibility.VtoAccessibility
import com.example.vtryon.core.designsystem.component.feedback.VtoProgressRing
import com.example.vtryon.core.designsystem.icon.VtoIconSize
import com.example.vtryon.core.designsystem.icon.VtoIconTone
import com.example.vtryon.core.designsystem.icon.VtoIconView
import com.example.vtryon.core.designsystem.motion.VtoMotion

/**
 * Primary Call-To-Action button with high-contrast monochrome surface,
 * tactile press feedback, embedded loading ring, and TalkBack accessibility.
 */
class VtoPrimaryButton @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private val contentContainer = LinearLayout(context).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER)
    }

    private val leadingIconView = VtoIconView(context).apply {
        iconSize = VtoIconSize.SM
        iconTone = VtoIconTone.INVERSE
        visibility = GONE
    }

    private val textView = TextView(context).apply {
        setTextAppearance(R.style.TextAppearance_VTryOn_LabelLarge)
        setTextColor(ContextCompat.getColor(context, R.color.vto_control_primary_content))
        gravity = Gravity.CENTER
        maxLines = 1
    }

    private val trailingIconView = VtoIconView(context).apply {
        iconSize = VtoIconSize.SM
        iconTone = VtoIconTone.INVERSE
        visibility = GONE
    }

    private val progressRing = VtoProgressRing(context).apply {
        setRingColor(ContextCompat.getColor(context, R.color.vto_control_primary_content))
        visibility = GONE
        layoutParams = LinearLayout.LayoutParams(
            (18 * resources.displayMetrics.density).toInt(),
            (18 * resources.displayMetrics.density).toInt()
        ).apply {
            marginEnd = (8 * resources.displayMetrics.density).toInt()
        }
    }

    private var isLoading = false
    private var originalText: CharSequence = ""

    init {
        isClickable = true
        isFocusable = true
        background = ContextCompat.getDrawable(context, R.drawable.vto_bg_btn_primary)
        minimumHeight = context.resources.getDimensionPixelSize(R.dimen.vto_control_height_md)

        val paddingH = context.resources.getDimensionPixelSize(R.dimen.vto_space_20)
        val paddingV = context.resources.getDimensionPixelSize(R.dimen.vto_space_12)
        setPadding(paddingH, paddingV, paddingH, paddingV)

        val spaceSm = (8 * resources.displayMetrics.density).toInt()
        leadingIconView.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { marginEnd = spaceSm }

        trailingIconView.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { marginStart = spaceSm }

        contentContainer.addView(progressRing)
        contentContainer.addView(leadingIconView)
        contentContainer.addView(textView)
        contentContainer.addView(trailingIconView)
        addView(contentContainer)

        VtoAccessibility.setButtonRole(this)

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.VtoPrimaryButton)
            val textAttr = a.getString(R.styleable.VtoPrimaryButton_vtoText)
            if (!textAttr.isNullOrEmpty()) {
                setText(textAttr)
            }
            val leadingRes = a.getResourceId(R.styleable.VtoPrimaryButton_vtoLeadingIcon, 0)
            if (leadingRes != 0) {
                setLeadingIcon(leadingRes)
            }
            val trailingRes = a.getResourceId(R.styleable.VtoPrimaryButton_vtoTrailingIcon, 0)
            if (trailingRes != 0) {
                setTrailingIcon(trailingRes)
            }
            val loadingAttr = a.getBoolean(R.styleable.VtoPrimaryButton_vtoLoading, false)
            if (loadingAttr) {
                setLoading(true)
            }
            a.recycle()
        }
    }

    fun setText(text: CharSequence) {
        originalText = text
        textView.text = text
    }

    fun getText(): CharSequence = textView.text

    fun setLeadingIcon(@DrawableRes iconRes: Int?) {
        if (iconRes != null && iconRes != 0) {
            leadingIconView.setHugeicon(iconRes, VtoIconTone.INVERSE)
            leadingIconView.visibility = if (isLoading) GONE else VISIBLE
        } else {
            leadingIconView.visibility = GONE
        }
    }

    fun setTrailingIcon(@DrawableRes iconRes: Int?) {
        if (iconRes != null && iconRes != 0) {
            trailingIconView.setHugeicon(iconRes, VtoIconTone.INVERSE)
            trailingIconView.visibility = VISIBLE
        } else {
            trailingIconView.visibility = GONE
        }
    }

    fun setLoading(loading: Boolean, loadingMessage: CharSequence? = null) {
        if (isLoading == loading) return
        isLoading = loading

        if (loading) {
            isEnabled = false
            progressRing.visibility = VISIBLE
            leadingIconView.visibility = GONE
            if (loadingMessage != null) {
                textView.text = loadingMessage
            }
        } else {
            isEnabled = true
            progressRing.visibility = GONE
            if (leadingIconView.drawable != null) {
                leadingIconView.visibility = VISIBLE
            }
            textView.text = originalText
        }
    }

    fun isLoading(): Boolean = isLoading

    override fun setEnabled(enabled: Boolean) {
        super.setEnabled(enabled)
        contentContainer.alpha = if (enabled) 1.0f else 0.5f
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (!isEnabled || isLoading) return super.onTouchEvent(event)

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
