package com.example.vtryon.core.designsystem.component.toolbar

import android.app.Activity
import android.content.Context
import android.util.AttributeSet
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView
import androidx.annotation.DrawableRes
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.brand.AppLogoView
import com.example.vtryon.core.designsystem.component.button.VtoIconButton
import com.example.vtryon.core.designsystem.icon.VtoIcons

/**
 * Custom top navigation bar supporting optional leading back button,
 * official brand logo, editorial page title, subtitle, and trailing action slots.
 */
class VtoTopBar @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : LinearLayout(context, attrs, defStyleAttr) {

    val backButton = VtoIconButton(context).apply {
        setIcon(com.example.vtryon.core.designsystem.icon.VtoIcon.Back)
        variant = VtoIconButton.Variant.QUIET
        visibility = GONE
    }

    private val logoView = AppLogoView(context).apply {
        val size = (28 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(size, size).apply {
            marginEnd = (12 * resources.displayMetrics.density).toInt()
        }
        visibility = GONE
    }

    private val titlesContainer = LinearLayout(context).apply {
        orientation = VERTICAL
        gravity = Gravity.CENTER_VERTICAL
        layoutParams = LayoutParams(0, LayoutParams.WRAP_CONTENT, 1.0f)
    }

    private val titleView = TextView(context).apply {
        setTextAppearance(R.style.TextAppearance_VTryOn_TitleMedium)
        setTextColor(ContextCompat.getColor(context, R.color.vto_content_primary))
        maxLines = 1
    }

    private val subtitleView = TextView(context).apply {
        setTextAppearance(R.style.TextAppearance_VTryOn_BodySmall)
        setTextColor(ContextCompat.getColor(context, R.color.vto_content_secondary))
        maxLines = 1
        visibility = GONE
    }

    val actionButton = VtoIconButton(context).apply {
        variant = VtoIconButton.Variant.QUIET
        visibility = GONE
    }

    var onBackClickListener: (() -> Unit)? = null

    init {
        orientation = HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        background = ContextCompat.getDrawable(context, R.color.vto_surface_primary)
        minimumHeight = context.resources.getDimensionPixelSize(R.dimen.vto_toolbar_height)

        val padH = (16 * resources.displayMetrics.density).toInt()
        setPadding(padH, 0, padH, 0)

        titlesContainer.addView(titleView)
        titlesContainer.addView(subtitleView)

        addView(backButton)
        addView(logoView)
        addView(titlesContainer)
        addView(actionButton)

        backButton.setOnClickListener {
            if (onBackClickListener != null) {
                onBackClickListener?.invoke()
            } else if (context is androidx.activity.ComponentActivity) {
                context.onBackPressedDispatcher.onBackPressed()
            } else if (context is Activity) {
                @Suppress("DEPRECATION")
                context.onBackPressed()
            }
        }

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.VtoTopBar)
            val title = a.getString(R.styleable.VtoTopBar_vtoTitle)
            if (!title.isNullOrEmpty()) {
                setTitle(title)
            }
            val subtitle = a.getString(R.styleable.VtoTopBar_vtoSubtitle)
            if (!subtitle.isNullOrEmpty()) {
                setSubtitle(subtitle)
            }
            val showBack = a.getBoolean(R.styleable.VtoTopBar_vtoShowBack, false)
            setShowBackButton(showBack)

            val showLogo = a.getBoolean(R.styleable.VtoTopBar_vtoShowLogo, false)
            setShowLogo(showLogo)

            val actionRes = a.getResourceId(R.styleable.VtoTopBar_vtoActionIcon, 0)
            if (actionRes != 0) {
                setActionIcon(actionRes, "Action")
            }
            a.recycle()
        }
    }

    fun setTitle(title: CharSequence) {
        titleView.text = title
    }

    fun setSubtitle(subtitle: CharSequence?) {
        if (!subtitle.isNullOrEmpty()) {
            subtitleView.text = subtitle
            subtitleView.visibility = VISIBLE
        } else {
            subtitleView.visibility = GONE
        }
    }

    fun setShowBackButton(show: Boolean) {
        backButton.visibility = if (show) VISIBLE else GONE
    }

    fun setShowBack(show: Boolean, onBack: (() -> Unit)? = null) {
        setShowBackButton(show)
        if (onBack != null) {
            onBackClickListener = onBack
        }
    }

    fun setShowLogo(show: Boolean) {
        logoView.visibility = if (show) VISIBLE else GONE
    }

    fun setAction(
        icon: com.example.vtryon.core.designsystem.icon.VtoIcon,
        contentDescription: CharSequence? = null,
        onClick: (() -> Unit)? = null
    ) {
        actionButton.setIcon(icon, contentDescription)
        actionButton.visibility = VISIBLE
        if (onClick != null) {
            actionButton.setOnClickListener { onClick() }
        }
    }

    fun setActionIcon(@DrawableRes iconRes: Int, contentDescription: String, onClick: (() -> Unit)? = null) {
        actionButton.setHugeicon(iconRes, contentDescription)
        actionButton.visibility = VISIBLE
        if (onClick != null) {
            actionButton.setOnClickListener { onClick() }
        }
    }
}
