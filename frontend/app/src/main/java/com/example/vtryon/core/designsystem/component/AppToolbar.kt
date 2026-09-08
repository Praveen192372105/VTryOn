package com.example.vtryon.core.designsystem.component

import android.content.Context
import android.util.AttributeSet
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import androidx.annotation.DrawableRes
import androidx.appcompat.widget.AppCompatTextView
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.brand.AppLogoView
import com.example.vtryon.core.designsystem.icon.AppIconSize
import com.example.vtryon.core.designsystem.icon.AppIconStyle
import com.example.vtryon.core.designsystem.icon.AppIconView

/**
 * Custom non-Material toolbar adhering to the editorial monochrome identity.
 * Replaces MaterialToolbar with clean framework Views.
 */
class AppToolbar @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private val backButton = AppIconView(context).apply {
        setHugeicon(R.drawable.vto_huge_arrow_left_02, AppIconStyle.PRIMARY)
        setIconSize(AppIconSize.LG)
        contentDescription = "Back"
        visibility = View.GONE
        val padding = (12 * resources.displayMetrics.density).toInt()
        setPadding(padding, padding, padding, padding)
        layoutParams = LayoutParams(
            resources.getDimensionPixelSize(R.dimen.min_touch_target),
            resources.getDimensionPixelSize(R.dimen.min_touch_target),
            Gravity.START or Gravity.CENTER_VERTICAL
        )
        isClickable = true
        isFocusable = true
    }

    private val logoView = AppLogoView(context).apply {
        visibility = View.GONE
        val size = (28 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(size, size, Gravity.START or Gravity.CENTER_VERTICAL).apply {
            leftMargin = (16 * resources.displayMetrics.density).toInt()
        }
    }

    private val titleContainer = LinearLayout(context).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER_VERTICAL
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER_VERTICAL).apply {
            leftMargin = (16 * resources.displayMetrics.density).toInt()
        }
    }

    private val titleView = AppCompatTextView(context).apply {
        setTextAppearance(context, R.style.TextAppearance_VTryOn_TitleMedium)
        setTextColor(ContextCompat.getColor(context, R.color.content_primary))
        isSingleLine = true
    }

    private val subtitleView = AppCompatTextView(context).apply {
        setTextAppearance(context, R.style.TextAppearance_VTryOn_BodySmall)
        setTextColor(ContextCompat.getColor(context, R.color.content_tertiary))
        visibility = View.GONE
        isSingleLine = true
    }

    private val actionsContainer = LinearLayout(context).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.END or Gravity.CENTER_VERTICAL
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT, Gravity.END or Gravity.CENTER_VERTICAL).apply {
            rightMargin = (8 * resources.displayMetrics.density).toInt()
        }
    }

    init {
        val defaultHeight = resources.getDimensionPixelSize(R.dimen.toolbar_height)
        minimumHeight = defaultHeight

        titleContainer.addView(titleView)
        titleContainer.addView(subtitleView)

        addView(backButton)
        addView(logoView)
        addView(titleContainer)
        addView(actionsContainer)

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.AppToolbar)
            val title = a.getString(R.styleable.AppToolbar_toolbarTitle)
            if (!title.isNullOrEmpty()) {
                setTitle(title)
            }

            val subtitle = a.getString(R.styleable.AppToolbar_toolbarSubtitle)
            if (!subtitle.isNullOrEmpty()) {
                setSubtitle(subtitle)
            }

            val showBack = a.getBoolean(R.styleable.AppToolbar_toolbarShowBack, false)
            setShowBack(showBack)

            val showLogo = a.getBoolean(R.styleable.AppToolbar_toolbarShowLogo, false)
            setShowLogo(showLogo)

            val actionIconRes = a.getResourceId(R.styleable.AppToolbar_toolbarActionIcon, 0)
            if (actionIconRes != 0) {
                addAction(actionIconRes, "Action") {}
            }
            a.recycle()
        }
    }

    fun setTitle(title: CharSequence) {
        titleView.text = title
        titleView.visibility = if (title.isNotEmpty()) View.VISIBLE else View.GONE
    }

    fun setSubtitle(subtitle: CharSequence?) {
        subtitleView.text = subtitle
        subtitleView.visibility = if (subtitle.isNullOrEmpty()) View.GONE else View.VISIBLE
    }

    fun setShowBack(show: Boolean, onBackClick: (() -> Unit)? = null) {
        backButton.visibility = if (show) View.VISIBLE else View.GONE
        if (show) {
            logoView.visibility = View.GONE
            (titleContainer.layoutParams as? LayoutParams)?.leftMargin =
                resources.getDimensionPixelSize(R.dimen.min_touch_target) + (4 * resources.displayMetrics.density).toInt()
            if (onBackClick != null) {
                backButton.setOnClickListener { onBackClick() }
            }
        }
    }

    fun setShowLogo(show: Boolean) {
        logoView.visibility = if (show) View.VISIBLE else View.GONE
        if (show) {
            backButton.visibility = View.GONE
            val logoMargin = (28 * resources.displayMetrics.density).toInt() + (24 * resources.displayMetrics.density).toInt()
            (titleContainer.layoutParams as? LayoutParams)?.leftMargin = logoMargin
        }
    }

    fun addAction(
        @DrawableRes iconRes: Int,
        contentDescription: String,
        style: AppIconStyle = AppIconStyle.PRIMARY,
        onClick: (View) -> Unit
    ): AppIconView {
        val actionView = AppIconView(context).apply {
            setHugeicon(iconRes, style)
            setIconSize(AppIconSize.LG)
            this.contentDescription = contentDescription
            val padding = (12 * resources.displayMetrics.density).toInt()
            setPadding(padding, padding, padding, padding)
            layoutParams = LinearLayout.LayoutParams(
                resources.getDimensionPixelSize(R.dimen.min_touch_target),
                resources.getDimensionPixelSize(R.dimen.min_touch_target)
            )
            isClickable = true
            isFocusable = true
            setOnClickListener(onClick)
        }
        actionsContainer.addView(actionView)
        return actionView
    }

    fun clearActions() {
        actionsContainer.removeAllViews()
    }
}
