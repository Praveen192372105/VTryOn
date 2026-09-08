package com.example.vtryon.core.designsystem.component

import android.content.Context
import android.util.AttributeSet
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import androidx.appcompat.widget.AppCompatTextView
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.icon.AppIconSize
import com.example.vtryon.core.designsystem.icon.AppIconStyle
import com.example.vtryon.core.designsystem.icon.AppIconView

/**
 * Editorial error view presenting friendly, actionable error messages with retry capability.
 * Never surfaces raw stack traces or raw server error bodies to users.
 */
class AppErrorView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : LinearLayout(context, attrs, defStyleAttr) {

    private val iconContainer = FrameLayout(context).apply {
        val size = (56 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(size, size).apply {
            gravity = Gravity.CENTER_HORIZONTAL
        }
        background = ContextCompat.getDrawable(context, R.drawable.bg_badge_pill)
    }

    private val iconView = AppIconView(context).apply {
        setHugeicon(R.drawable.vto_huge_alert_circle, AppIconStyle.ERROR)
        setIconSize(AppIconSize.XL)
        layoutParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.CENTER
        )
    }

    private val titleView = AppCompatTextView(context).apply {
        setTextAppearance(context, R.style.TextAppearance_VTryOn_TitleMedium)
        setTextColor(ContextCompat.getColor(context, R.color.content_primary))
        gravity = Gravity.CENTER
        val marginTop = (16 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = marginTop
            gravity = Gravity.CENTER_HORIZONTAL
        }
    }

    private val messageView = AppCompatTextView(context).apply {
        setTextAppearance(context, R.style.TextAppearance_VTryOn_BodyMedium)
        setTextColor(ContextCompat.getColor(context, R.color.content_secondary))
        gravity = Gravity.CENTER
        val marginTop = (8 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = marginTop
            gravity = Gravity.CENTER_HORIZONTAL
        }
    }

    private val retryButton = AppButton(context).apply {
        setVariant(AppButton.Variant.SECONDARY)
        setLeadingIcon(R.drawable.vto_huge_refresh_01)
        setText("Retry")
        visibility = View.GONE
        val marginTop = (20 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = marginTop
            gravity = Gravity.CENTER_HORIZONTAL
        }
    }

    init {
        orientation = VERTICAL
        gravity = Gravity.CENTER
        val padding = (24 * resources.displayMetrics.density).toInt()
        setPadding(padding, padding, padding, padding)

        iconContainer.addView(iconView)
        addView(iconContainer)
        addView(titleView)
        addView(messageView)
        addView(retryButton)

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.AppErrorView)
            val title = a.getString(R.styleable.AppErrorView_errorTitle)
            if (!title.isNullOrEmpty()) {
                setTitle(title)
            }

            val msg = a.getString(R.styleable.AppErrorView_errorMessage)
            if (!msg.isNullOrEmpty()) {
                setMessage(msg)
            }

            val retryText = a.getString(R.styleable.AppErrorView_errorRetryText)
            if (!retryText.isNullOrEmpty()) {
                setRetryAction(retryText) {}
            }
            a.recycle()
        }
    }

    fun setTitle(title: CharSequence) {
        titleView.text = title
    }

    fun setMessage(message: CharSequence) {
        messageView.text = message
    }

    fun setRetryAction(text: CharSequence = "Retry", onRetry: () -> Unit) {
        retryButton.setText(text)
        retryButton.setOnClickListener { onRetry() }
        retryButton.visibility = View.VISIBLE
    }

    fun hideRetryAction() {
        retryButton.visibility = View.GONE
    }
}
