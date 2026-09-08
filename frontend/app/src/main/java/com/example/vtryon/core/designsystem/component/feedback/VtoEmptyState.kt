package com.example.vtryon.core.designsystem.component.feedback

import android.content.Context
import android.util.AttributeSet
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView
import androidx.annotation.DrawableRes
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.component.button.VtoPrimaryButton
import com.example.vtryon.core.designsystem.icon.VtoIconSize
import com.example.vtryon.core.designsystem.icon.VtoIconTone
import com.example.vtryon.core.designsystem.icon.VtoIconView

/**
 * Editorial empty / offline / error state with Hugeicon, title, description,
 * and an optional primary CTA action.
 */
class VtoEmptyState @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : LinearLayout(context, attrs, defStyleAttr) {

    private val iconView = VtoIconView(context).apply {
        iconSize = VtoIconSize.HERO
        iconTone = VtoIconTone.TERTIARY
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            bottomMargin = (16 * resources.displayMetrics.density).toInt()
        }
    }

    private val titleView = TextView(context).apply {
        setTextAppearance(R.style.TextAppearance_VTryOn_TitleMedium)
        setTextColor(ContextCompat.getColor(context, R.color.vto_content_primary))
        gravity = Gravity.CENTER
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            bottomMargin = (8 * resources.displayMetrics.density).toInt()
        }
    }

    private val descriptionView = TextView(context).apply {
        setTextAppearance(R.style.TextAppearance_VTryOn_BodyMedium)
        setTextColor(ContextCompat.getColor(context, R.color.vto_content_secondary))
        gravity = Gravity.CENTER
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            bottomMargin = (20 * resources.displayMetrics.density).toInt()
        }
    }

    val actionButton = VtoPrimaryButton(context).apply {
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
        visibility = GONE
    }

    init {
        orientation = VERTICAL
        gravity = Gravity.CENTER
        val pad = (24 * resources.displayMetrics.density).toInt()
        setPadding(pad, pad, pad, pad)

        addView(iconView)
        addView(titleView)
        addView(descriptionView)
        addView(actionButton)

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.VtoEmptyState)
            val iconRes = a.getResourceId(R.styleable.VtoEmptyState_vtoEmptyIcon, 0)
            if (iconRes != 0) {
                setIcon(iconRes)
            }
            val title = a.getString(R.styleable.VtoEmptyState_vtoEmptyTitle)
            if (!title.isNullOrEmpty()) {
                setTitle(title)
            }
            val desc = a.getString(R.styleable.VtoEmptyState_vtoEmptyDescription)
            if (!desc.isNullOrEmpty()) {
                setDescription(desc)
            }
            val actionText = a.getString(R.styleable.VtoEmptyState_vtoEmptyActionText)
            if (!actionText.isNullOrEmpty()) {
                setAction(actionText) {}
            }
            a.recycle()
        }
    }

    fun setIcon(icon: com.example.vtryon.core.designsystem.icon.VtoIcon, tone: VtoIconTone = VtoIconTone.TERTIARY) {
        iconView.setIcon(icon, tone)
    }

    fun setIcon(@DrawableRes iconRes: Int) {
        iconView.setImageResource(iconRes)
    }

    fun setTitle(title: CharSequence) {
        titleView.text = title
    }

    fun setDescription(desc: CharSequence) {
        descriptionView.text = desc
    }

    fun setAction(text: CharSequence, onClick: () -> Unit) {
        actionButton.setText(text)
        actionButton.visibility = VISIBLE
        actionButton.setOnClickListener { onClick() }
    }
}
