package com.example.vtryon.core.designsystem.component

import android.content.Context
import android.util.AttributeSet
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import androidx.annotation.DrawableRes
import androidx.appcompat.widget.AppCompatTextView
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.icon.AppIconSize
import com.example.vtryon.core.designsystem.icon.AppIconStyle
import com.example.vtryon.core.designsystem.icon.AppIconView

/**
 * Editorial empty state view presenting a Hugeicon, clear explanation,
 * and optional actionable button.
 */
class AppEmptyStateView @JvmOverloads constructor(
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
        setIconSize(AppIconSize.XL)
        setIconStyle(AppIconStyle.PRIMARY)
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

    private val descriptionView = AppCompatTextView(context).apply {
        setTextAppearance(context, R.style.TextAppearance_VTryOn_BodyMedium)
        setTextColor(ContextCompat.getColor(context, R.color.content_secondary))
        gravity = Gravity.CENTER
        val marginTop = (8 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = marginTop
            gravity = Gravity.CENTER_HORIZONTAL
        }
    }

    private val actionButton = AppButton(context).apply {
        setVariant(AppButton.Variant.SECONDARY)
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
        addView(descriptionView)
        addView(actionButton)

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.AppEmptyStateView)
            val iconRes = a.getResourceId(R.styleable.AppEmptyStateView_emptyIcon, 0)
            if (iconRes != 0) {
                setIcon(iconRes)
            }

            val title = a.getString(R.styleable.AppEmptyStateView_emptyTitle)
            if (!title.isNullOrEmpty()) {
                setTitle(title)
            }

            val desc = a.getString(R.styleable.AppEmptyStateView_emptyDescription)
            if (!desc.isNullOrEmpty()) {
                setDescription(desc)
            }

            val actionText = a.getString(R.styleable.AppEmptyStateView_emptyActionText)
            if (!actionText.isNullOrEmpty()) {
                setAction(actionText) {}
            }
            a.recycle()
        }
    }

    fun setIcon(@DrawableRes iconRes: Int) {
        iconView.setHugeicon(iconRes, AppIconStyle.PRIMARY)
    }

    fun setTitle(title: CharSequence) {
        titleView.text = title
    }

    fun setDescription(description: CharSequence) {
        descriptionView.text = description
    }

    fun setAction(text: CharSequence, onClick: (View) -> Unit) {
        actionButton.setText(text)
        actionButton.setOnClickListener(onClick)
        actionButton.visibility = View.VISIBLE
    }

    fun hideAction() {
        actionButton.visibility = View.GONE
    }
}
